import { readFileSync, readFile } from 'fs'
import { jsondiffpatch } from './utils'
import { dirname, join } from 'path'
import { log, colors } from 'gulp-util'

const {safeLoad, dump} = require('js-yaml')
const _ = require('lodash')

export function getFixup (fixupFileName, originalYaml, editedYaml) {
  const original = safeLoad(originalYaml)
  const edited = safeLoad(editedYaml)

  if (_.isEqual(original, edited)) {
    return ''
  }

  let fixup

  try {
    const fixupYaml = readFileSync(fixupFileName, 'utf8')
    fixup = safeLoad(fixupYaml)
  } catch (ign) {}

  if (fixup) {
    jsondiffpatch.unpatch(original, fixup)
  }

  const diff = jsondiffpatch.diff(original, edited)

  return dump(diff)
}

export function refreshFixup (ctx) {
  return new Promise((resolve, reject) => {
    const swaggerFileName = join(dirname(ctx.path), 'swagger.yaml')
    readFile(swaggerFileName, 'utf8', (err, swaggerYaml) => {
      if (err) {
        log(colors.red('missing'), ctx.relative)
        resolve()
        // reject(err)
      } else {
        const original = safeLoad(swaggerYaml)
        const reverted = safeLoad(swaggerYaml)
        const fixupYaml = ctx.contents.toString()
        const fixup = safeLoad(fixupYaml)
        jsondiffpatch.unpatch(reverted, fixup)
        const diff = jsondiffpatch.diff(reverted, original)
        const diffYaml = dump(diff)

        if (fixupYaml !== diffYaml) {
          ctx.contents = Buffer.from(diffYaml)
          log(colors.magenta('updating'), ctx.relative)
        } else {
          log(colors.cyan('skipping'), ctx.relative)
        }

        resolve()
      }
    })
  })
}
