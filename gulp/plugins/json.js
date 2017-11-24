const {obj} = require('through2')
const {load} = require('js-yaml')
const {log, colors, PluginError} = require('gulp-util')
const stringify = (json) => (require('json-stringify-pretty-compact')(json, {maxLength: 120}))
const {dirname} = require('path')
// const stringify = JSON.stringify

const PLUGIN_NAME = 'json'

export function json ({verbose} = {}) {
  return obj(function (file, enc, cb) {
    if (verbose) {
      log(PLUGIN_NAME, colors.grey(dirname(file.relative)))
    }

    file.yaml = file.contents

    try {
      file.json = load(file.contents)
      file.contents = Buffer.from(stringify(file.json))
    } catch (err) {
      log(PLUGIN_NAME, colors.red(file.relative))
      return cb(new PluginError(PLUGIN_NAME, err.toString(), {fileName: file.path}))
    }

    cb(null, file)
  })
}
