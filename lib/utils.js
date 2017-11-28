const assert = require('assert')
const _ = require('lodash')
const sanitize = require('sanitize-filename')
const {safeLoad} = require('js-yaml')
const {readFile} = require('fs')
const {dirname, join} = require('path')

export function getServiceName (swagger) {
  return swagger.info['x-serviceName']
}

export function getApiId (swagger) {
  let id = getProviderName(swagger)

  assert(id.indexOf(':') === -1)

  const service = getServiceName(swagger)

  if (!_.isUndefined(service)) {
    assert(service.indexOf(':') === -1)
    id += ':' + service
  }

  return id
}

export function getProviderName (swagger) {
  assert(swagger.info['x-providerName'])

  return swagger.info['x-providerName']
}

export function getOrigin (swagger) {
  return swagger.info['x-origin']
}

export function getOriginUrl (swagger) {
  return _.last(getOrigin(swagger)).url
}

export function getSwaggerPath (swagger, filename) {
  filename = filename || 'swagger.yaml'
  return getPathComponents(swagger).join('/') + '/' + filename
}

export function getPathComponents (swagger, stripVersion) {
  const serviceName = getServiceName(swagger)
  let path = [exports.getProviderName(swagger)]

  if (serviceName) {
    path.push(serviceName)
  }

  if (!stripVersion) {
    let version = swagger.info.version || '1.0.0'
    version = version.split(' (')[0]
    path.push(version)
  }

  path = _.map(path, function (str) {
    str = sanitize(str)
    assert(!_.isEmpty(str))
    return str
  })

  return path
}

export function readYamlAsync (filename) {
  return new Promise((resolve) => {
    readFile(filename, 'utf-8', (err, data) => {
      if (err) {
        resolve()
      } else {
        resolve(safeLoad(data))
      }
    })
  })
}

export function fixupFile (swaggerPath) {
  return join(dirname(swaggerPath), 'fixup.yaml')
}
