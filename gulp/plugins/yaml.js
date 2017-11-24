const {obj} = require('through2')
const {dump} = require('js-yaml')
const {log, colors} = require('gulp-util')
const {dirname} = require('path')

const PLUGIN_NAME = 'yaml'

export function yaml ({verbose} = {}) {
  return obj(function (file, enc, cb) {
    if (file.yaml) {
      file.contents = file.yaml
    } else {
      file.contents = Buffer.from(dump(file.json))
    }

    if (verbose) {
      log(PLUGIN_NAME, colors.grey(dirname(file.relative)))
    }

    cb(null, file)
  })
}
