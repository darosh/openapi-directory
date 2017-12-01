const {obj} = require('through2')
const {colors} = require('gulp-util')
const glog = require('gulplog')
const {dirname} = require('path')

const PLUGIN_NAME = 'yaml'

export function yaml (field) {
  const {dump} = require('js-yaml')

  return obj(function (file, enc, cb) {
    if (field) {
      file.contents = Buffer.from(dump(file[field]))
    } else {
      if (file.yaml) {
        file.contents = file.yaml
      } else {
        file.contents = Buffer.from(dump(file.json))
      }
    }

    glog.debug(PLUGIN_NAME, colors.grey(dirname(file.relative)))

    cb(null, file)
  })
}
