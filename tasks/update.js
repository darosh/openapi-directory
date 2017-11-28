import { json, leads, transform as $ } from '../plugins'
import {
  addFixes,
  addPatch,
  addSwaggerFixup,
  applyFixup,
  convertToSwagger,
  expandPathTemplates,
  extractApiKeysFromParameters,
  getMeta,
  loadSpec,
  patchSwagger,
  postValidation,
  replaceSpacesInSchemaNames,
  runValidateAndFix,
  simplifyProduceConsume
} from '../lib/spec'

const {src, dest} = require('gulp')
const rename = require('gulp-rename')
const {log, colors} = require('gulp-util')
const _ = (d) => require('gulp-if')(file => !!file.contents, dest(d))

export function update (source, blacklist) {
  return function () {
    log('Reading', `'${colors.cyan(source)}'`)

    return src(source)
      .pipe(json())
      .pipe(leads(blacklist))
      .pipe(rename({extname: '.json'}))
      .pipe($('lead')).pipe(_('.log/lead'))
      .pipe($(getMeta)).pipe($(loadSpec, 'spec', 32)).pipe(_('.log/spec'))
      .pipe($(addFixes('fixes'), 'fixup', 8)).pipe(_('.log/fixup'))
      .pipe($(applyFixup, 'spec')).pipe(_('.log/fixed'))
      .pipe($(convertToSwagger, 'swagger')).pipe(_('.log/convert'))
      .pipe($(addPatch('APIs'), 'patch', 8)).pipe(_('.log/patch'))
      .pipe($(addSwaggerFixup, 'swaggerFixup', 8)).pipe(_('.log/swaggerFixup'))

      .pipe($(patchSwagger, 'swagger'))
      .pipe($(expandPathTemplates, 'swagger'))
      .pipe($(replaceSpacesInSchemaNames, 'swagger'))
      .pipe($(extractApiKeysFromParameters, 'swagger'))
      .pipe($(simplifyProduceConsume, 'swagger'))
      .pipe(_('.log/patched'))

      .pipe($(runValidateAndFix, 'validation')).pipe(_('.log/validation'))
      .pipe($(postValidation, 'swagger')).pipe(_('.log/updated'))
      .pipe($('warnings')).pipe(_('.log/warnings'))
      .pipe($('fatal')).pipe(_('.log/fatal'))
      .pipe($('validation.warnings')).pipe(_('.log/validation.warnings'))
      .pipe($('validation.errors')).pipe(_('.log/validation.errors'))
      .pipe($('validation.info')).pipe(_('.log/validation.info'))
  }
}
