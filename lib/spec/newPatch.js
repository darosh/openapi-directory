// import { getPathComponents } from '../utils'
//
// const {join} = require('path')

export function newPatch (ctx) {
  delete ctx.exPatch.info['x-providerName']
  delete ctx.exPatch.info['x-serviceName']
  delete ctx.exPatch.info['x-preferred']
  delete ctx.exPatch.info['x-origin']

  if (Object.keys(ctx.exPatch.info).length) {
    // const patchFilename = join(getPathComponents(ctx.swagger, true).join('/'), 'patch.yaml')
    // const patchFilename2 = join(getPathComponents(ctx.swagger).join('/'), 'patch.yaml')

    // if (!fs.existsSync(patchFilename) && !fs.existsSync(patchFilename2)) {
    //   console.log('* Wrote new ' + patchFilename)
    // fs.writeFileSync(patchFilename, YAML.safeDump(exPatch, {lineWidth: -1}), 'utf8')
    // }
  }
}
