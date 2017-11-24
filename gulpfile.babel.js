import { s3 } from './gulp/tasks/s3'
import { update } from './gulp/tasks/update'
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
const gulp = require('gulp')
const rename = require('gulp-rename')
const del = require('del')
const _ = (d) => require('gulp-if')(file => !!file.contents, dest(d))
const usage = require('gulp-help-doc')
// const {argv: args} = require('yargs')

task('build', () => src('APIs/**/swagger.yaml')
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
)

task('s3', s3(
  [['.dist/**', '']],
  // {region: 'us-east-1', params: {Bucket: 'api.apis.guru'}},
  {region: 'us-east-1', params: {Bucket: 'openapi-directory.eu'}},
  '.cache/s3.json'
))

/**
 * Deletes all artifact folders.
 *
 * @task {clean}
 * @group {Cleaning tasks}
 */
task('clean', () => del(['.dist', '.cache', '.log']))

/**
 * Deletes '.log' folder
 *
 * @task {clean:log}
 * @group {Cleaning tasks}
 */
task('clean:log', () => del(['.log']))

/**
 * Deletes '.cache/test' folder.
 *
 * @task {clean:test}
 * @group {Cleaning tasks}
 */
task('clean:test', () => del(['.cache/test']))

/**
 * Deletes HTTP cache and stored responses.
 *
 * @task {clean:http}
 * @group {Cleaning tasks}
 */
task('clean:http', () => del(['.cache/http', '.cache/https', '.cache/http.sqlite']))

/**
 * Deletes all built specs.
 *
 * @task {clean:specs}
 * @group {Cleaning tasks}
 */
task('clean:specs', () => del(['.dist/v2/specs', '.dist/v2/*.json']))

/**
 * Rebuild specs in '.dist' folder.
 *
 * @task {rebuild}
 */
task('rebuild', series('clean:specs', 'build'))

task('index', () => src('resources/index.html').pipe(dest('.dist/v2')))

task('swagger', () => src('resources/apis_guru_swagger.yaml')
  .pipe(json())
  .pipe(swagger('https://api.apis.guru/v2/'))
  .pipe(rename('swagger.json'))
  .pipe(dest('.dist/v2'))
  .pipe(yaml())
  .pipe(rename('swagger.yaml'))
  .pipe(dest('.dist/v2'))
)

task('badge', () => src('.dist/v2/metrics.json').pipe(badge('.dist/badges')).pipe(dest('.dist/badges')))

/**
 * Validate API specifications with high-level report only and without writing detailed '.log' files.
 *
 * @task {test:quite}
 * @group {Continuous integration tasks}
 */
task('test:quite', () => src('APIs/**/swagger.yaml')
  .pipe(json())
  .pipe(validate({quite: true, cache: '.cache/test'}))
  .pipe(preferred())
)

/**
 * Validate API specifications.
 *
 * @task {test}
 */
task('test', () => src('APIs/**/swagger.yaml')
  .pipe(json())
  .pipe(validate({cache: '.cache/test'}))
  .pipe($('warnings')).pipe(_('.log/warnings'))
  .pipe($('fatal')).pipe(_('.log/fatal'))
  .pipe($('validation.warnings')).pipe(_('.log/test.warnings'))
  .pipe($('validation.errors')).pipe(_('.log/test.errors'))
  .pipe($('validation.info')).pipe(_('.log/test.info'))
  .pipe(preferred())
)

task('online', online())

/**
 * Rebuild and deploy to Amazon S3.
 *
 * @task {deploy}
 * @group {Continuous integration tasks}
 */
task('deploy', series('online', 'rebuild', 'index', 'badge', 's3'))

task('update:leads', update('APIs/**/swagger.yaml'))

/**
 * Update specs from sources.
 *
 * @task {update}
 */
task('update', series(parallel('clean:log', 'online'), 'update:leads'))

task('default', function help (cb) {
  usage(gulp)
  cb()
})

/**
 * Test & deploy main CI task.
 *
 * @task {publish}
 * @group {Continuous integration tasks}
 */
task('publish', series('test:quite', 'deploy'))
