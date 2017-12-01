import { getPathComponents } from '../utils'

const {access} = require('fs')
const {join} = require('path')

export function newPatch (ctx) {
  return new Promise(resolve => {
    const {safeDump} = require('js-yaml')

    delete ctx.exPatch.info['x-providerName']
    delete ctx.exPatch.info['x-serviceName']
    delete ctx.exPatch.info['x-preferred']
    delete ctx.exPatch.info['x-origin']

    if (Object.keys(ctx.exPatch.info).length) {
      const patchFilename = join(getPathComponents(ctx.swagger, true).join('/'), 'patch.yaml')
      const patchFilename2 = join(getPathComponents(ctx.swagger).join('/'), 'patch.yaml')

      Promise.all([exists(patchFilename), exists(patchFilename2)])
        .then(values => {
          if (!values[0] && !values[1]) {
            ctx.patch = safeDump(ctx.exPatch, {lineWidth: -1})
            ctx.patchFile = patchFilename
            resolve(true)
          } else {
            resolve(false)
          }
        })
    }
  })
}

function exists (fp) {
  return new Promise(resolve => {
    access(fp, err => {
      resolve(!err)
    })
  })
}
