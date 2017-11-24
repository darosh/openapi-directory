import got from './got'
import { cache } from './cache'

const Promise = require('bluebird')
const converter = require('api-spec-converter')
const converterVersion = require('api-spec-converter/package.json').version

converter.ResourceReaders.url = function (url) {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

  return new Promise((resolve, reject) => got(url, {
    headers: {
      'Accept': 'application/json,*/*',
      'if-modified-since': null
    },
    retries: 2,
    json: false,
    cache
  })
    .then(({body}) => {
      resolve(body)
    })
    .catch((err) => {
      reject(err)
    }))
}

const getFormatName = converter.getFormatName
const getSpec = converter.getSpec

export {
  converterVersion,
  getFormatName,
  getSpec
}
