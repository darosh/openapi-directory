/* eslint-disable camelcase */

import { s3 } from './tasks/s3'
import { update as update_from_leads } from './tasks/update'
import {
  api,
  apis,
  badge,
  git,
  json,
  logo, online,
  preferred,
  swagger,
  transform as $,
  validate,
  empty,
  yaml
} from './plugins'

const {argv} = require('yargs')
const {src, dest, task, series, parallel} = require('gulp')
const {log, colors} = require('gulp-util')
const rename = require('gulp-rename')
const del = require('del')
const gif = require('gulp-if')
const {readFileSync} = require('fs')
const _ = (d) => gif(file => !!file.contents, dest(d))

/**
 * Configuration
 */

require('./lib/got').setCacheFirst(!argv.skipCache)

/**
 * Clean tasks
 */

const clean_cache = () => del(['.cache'])
clean_cache.description = 'Delete ".cache" folder'
task('clean_cache', clean_cache)

const clean_dist = () => del(['.dist'])
clean_dist.description = 'Delete ".dist" folder'
task('clean_dist', clean_dist)

const clean_log = () => del(['.log'])
clean_log.description = 'Delete ".log" folder'
task('clean_log', clean_log)

const clean_http = () => del(['.cache/http', '.cache/https', '.cache/http.db'])
clean_http.description = 'Delete HTTP cache and stored responses'
task('clean_http', clean_http)

const clean_specs = () => del(['.dist/v2/specs', '.dist/v2/*.json'])
clean_specs.description = 'Delete built specs'
task('clean_specs', clean_specs)

const clean_test = () => del(['.cache/test'])
clean_test.description = 'Delete ".cache/test" folder'
task('clean_test', clean_test)

const clean = parallel('clean_log', 'clean_cache', 'clean_dist')
clean.description = 'Delete all artifact folders'
task('clean', clean)

/**
 * Helper tasks
 */

task('online', online())

/**
 * Test tasks
 */

const test = () => src('APIs/**/swagger.yaml')
  .pipe(json())
  .pipe(validate({cache: '.cache/test'}))
  .pipe($('warnings')).pipe(_('.log/warnings'))
  .pipe($('fatal')).pipe(_('.log/fatal'))
  .pipe($('validation.warnings')).pipe(_('.log/test.warnings'))
  .pipe($('validation.errors')).pipe(_('.log/test.errors'))
  .pipe($('validation.info')).pipe(_('.log/test.info'))
  .pipe(preferred())
test.description = 'Validate API specifications'
task('test', test)

const test_quite = () => src('APIs/**/swagger.yaml')
  .pipe(json())
  .pipe(validate({quite: true, cache: '.cache/test'}))
  .pipe(preferred())
test_quite.description = 'Validate API specifications, summary only, no ".log/**" files'
task('test_quite', test_quite)

/**
 * Spec tasks
 */

const update_leads = update_from_leads('APIs/**/swagger.yaml')
update_leads.flags = {
  '--skip-cache': 'Use "RFC compliant cache", instead of "use cache first"'
}
task('update_leads', update_leads)

const update = series('online', 'clean_log', 'update_leads')
update.description = 'Update specs from sources'
task('update', update)

/**
 * Build tasks
 */

const build_badges = () => {
  const metrics = JSON.parse(readFileSync('.dist/v2/metrics.json'))
  return empty()
    .pipe(badge('.dist/badges', [
      ['APIs in collection', metrics.numAPIs, 'orange'],
      ['Endpoints', metrics.numEndpoints, 'red'],
      ['OpenAPI specs', metrics.numSpecs, 'yellow'],
      ['Tested on', metrics.numSpecs + ' specs', 'green', readFileSync('branding/icon-16x16.png', 'base64')]]))
    .pipe(dest('.dist/badges'))
}
build_badges.description = 'Download shield.io images'
task('build_badges', build_badges)

const build_specs = () => src('APIs/**/swagger.yaml')
  .pipe(json()) // stores 'contents' in 'yaml', adds 'json', converts to JSON
  .pipe(logo('.dist/v2/cache/logo')) // adds 'logo'
  .pipe(gif(!argv.skipGit, git())) // adds 'dates'
  .pipe(api('https://api.apis.guru/v2/cache/logo/')) // modifies 'json.info'
  .pipe(rename({extname: '.json'}))
  .pipe($('json'))
  .pipe(dest('.dist/v2/specs'))
  .pipe(yaml())
  .pipe(rename({extname: '.yaml'}))
  .pipe(dest('.dist/v2/specs'))
  .pipe(apis('https://api.apis.guru/v2/', 'list.json', 'metrics.json')) // creates <api.json> and <metrics.json>
  .pipe(dest('.dist/v2'))
build_specs.description = 'Build specifications and logos'
build_specs.flags = {
  '--skip-git': 'Do not add "added" and "modified" dates from Git log'
}
task(build_specs)

task('build_index', () => src('resources/index.html').pipe(dest('.dist/v2')))

const build_swagger = () => src('resources/apis_guru_swagger.yaml')
  .pipe(json())
  .pipe(swagger('https://api.apis.guru/v2/'))
  .pipe(rename('swagger.json'))
  .pipe(dest('.dist/v2'))
  .pipe(yaml())
  .pipe(rename('swagger.yaml'))
  .pipe(dest('.dist/v2'))
task('build_swagger', build_swagger)

export const build = series('clean_specs', 'build_specs', 'build_index', 'build_swagger', 'build_badges')
task('build', build)

/**
 * Publish tasks
 */

task(s3(
  [['.dist/**', '']],
  // {region: 'us-east-1', params: {Bucket: 'api.apis.guru'}},
  {region: 'us-east-1', params: {Bucket: 'openapi-directory.eu'}},
  '.cache/s3.json'
))

export const deploy = series('online', 'build', 's3')
deploy.description = 'Build and deploy to S3'
task('deploy', deploy)

export const test_and_deploy = series('test_quite', 'deploy')
test_and_deploy.description = 'Main CI task'

/**
 * Default task
 */

export default function (done) {
  log('Tools version', colors.cyan(require('./package.json').version))
  log('Engine version', colors.cyan(process.version))
  log('Working directory', colors.magenta(process.cwd()))
  log('Arguments')
  console.log(colors.magenta(JSON.stringify(argv, null, 2)))
  done()
}
