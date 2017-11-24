import { s3 } from './gulp/tasks/s3'
import { update } from './gulp/tasks/update'
import {
  api,
  apis,
  badge,
  git,
  json,
  logo,
  preferred,
  swagger,
  transform as $,
  validate,
  yaml
} from './gulp/plugins'

const {src, dest, task, series} = require('gulp')
const rename = require('gulp-rename')
const del = require('del')
const _ = (d) => require('gulp-if')(file => !!file.contents, dest(d))

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

task('clean', () => del(['.dist', '.cache', '.log']))
task('clean:log', () => del(['.log']))
task('clean:validation', () => del(['.cache/validation']))
task('clean:http', () => del(['.cache/http', '.cache/https', '.cache/http.sqlite']))
task('clean:specs', () => del(['.dist/v2/specs', '.dist/v2/*.json']))
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

task('validate:quite', () => src('APIs/**/swagger.yaml')
  .pipe(json())
  .pipe(validate({quite: true, cache: '.cache/validate'}))
  .pipe(preferred())
)

task('validate', () => src('APIs/**/swagger.yaml')
  .pipe(json())
  .pipe(validate({cache: '.cache/validate'}))
  .pipe($('warnings')).pipe(_('.log/warnings'))
  .pipe($('fatal')).pipe(_('.log/fatal'))
  .pipe($('validation.warnings')).pipe(_('.log/validation.warnings'))
  .pipe($('validation.errors')).pipe(_('.log/validation.errors'))
  .pipe($('validation.info')).pipe(_('.log/validation.info'))
  .pipe(preferred())
)

task('deploy', series('rebuild', 'index', 'badge', 's3'))
task('default', series('validate:quite', 'deploy'))
task('update:leads', update('APIs/**/swagger.yaml'))
task('update', series('clean:log', 'update:leads'))
