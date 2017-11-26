/* eslint-disable camelcase */

import { s3 } from './gulp/tasks/s3'
import { update as update_from_leads } from './gulp/tasks/update'
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
  yaml
} from './gulp/plugins'

const {src, dest, task, series, parallel} = require('gulp')
const rename = require('gulp-rename')
const del = require('del')
const _ = (d) => require('gulp-if')(file => !!file.contents, dest(d))

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

const test = function () {
  src('APIs/**/swagger.yaml')
    .pipe(json())
    .pipe(validate({cache: '.cache/test'}))
    .pipe($('warnings')).pipe(_('.log/warnings'))
    .pipe($('fatal')).pipe(_('.log/fatal'))
    .pipe($('validation.warnings')).pipe(_('.log/test.warnings'))
    .pipe($('validation.errors')).pipe(_('.log/test.errors'))
    .pipe($('validation.info')).pipe(_('.log/test.info'))
    .pipe(preferred())
}
test.description = 'Validate API specifications'
task('test', test)

const test_quite = function () {
  return src('APIs/**/swagger.yaml')
    .pipe(json())
    .pipe(validate({quite: true, cache: '.cache/test'}))
    .pipe(preferred())
}
test_quite.description = 'Validate API specifications, summary only, no ".log/**" files'
task('test_quite', test_quite)

/**
 * Spec tasks
 */

task('update_leads', update_from_leads('APIs/**/swagger.yaml'))

const update = series('online', 'clean_log', 'update_leads')
update.description = 'Update specs from sources'
task('update', update)

/**
 * Build tasks
 */

const build_badges = () => src('.dist/v2/metrics.json').pipe(badge('.dist/badges')).pipe(dest('.dist/badges'))
build_badges.description = 'Download shield.io images'
task('build_badges', build_badges)

const build_specs = () => src('APIs/**/swagger.yaml')
  .pipe(json()) // stores 'contents' in 'yaml', adds 'json', converts to JSON
  .pipe(logo('.dist/v2/cache/logo')) // adds 'logo'
  .pipe(git()) // adds 'dates'
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
  done()
}
