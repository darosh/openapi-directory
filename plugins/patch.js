import { newPatch } from '../lib/spec'

const {File, log, colors} = require('gulp-util')

export function patch (file) {
  const _this = this

  return newPatch(file).then(add => {
    if (add) {
      log('new patch', colors.cyan(file.patchFile))
      _this.push(new File({
        contents: Buffer.from(file.patch),
        path: file.patchFile
      }))
    }
  })
}
