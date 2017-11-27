const {obj} = require('through2')
const stringify = (json) => (require('json-stringify-pretty-compact')(json, {maxLength: 120}))
const {URL} = require('url')

export function swagger (rootUrl) {
  return obj(function (file, enc, cb) {
    const baseUrl = new URL(rootUrl)
    delete file.yaml
    file.json.schemes = [baseUrl.protocol]
    file.json.host = baseUrl.host
    file.json.basePath = baseUrl.pathname
    file.contents = Buffer.from(stringify(file.json))
    cb(null, file)
  })
}
