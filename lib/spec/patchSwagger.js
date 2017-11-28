import { jsondiffpatch } from './utils'
import {sortParameters, sortTags} from '../sortParameters.js'

const assert = require('assert')
const _ = require('lodash')

export function patchSwagger ({swagger, exPatch, patch, swaggerFixup}) {
  delete exPatch.info.version // testing

  if (swagger.info.version && swagger.info.version === 'version') { delete swagger.info.version }

  // use 1.0.0 as default version
  if (_.isUndefined(swagger.info.version)) { swagger.info.version = '1.0.0' }

  if (swagger.info.logo && swagger.host === 'api.nytimes.com') { delete swagger.info.logo }

  // swagger-converter if title is absent use host as default
  if (swagger.info.title === swagger.host) { delete swagger.info.title }

  // Cleanup from common postfixes
  _.some([
    'API Documentation',
    'JSON API',
    'REST API',
    'Web API',
    'RESTful API',
    'API'
  ], function (postfix) {
    const regex = new RegExp('(.*)(^| )' + postfix + '$')
    const match = (swagger.info.title || '').match(regex)
    if (!match) { return false }
    swagger.info.title = match[1]
    return true
  })

  removeEmpty(swagger.info)

  if (swagger.host.indexOf('googleapis.com') >= 0) {
    sortParameters(swagger)
    sortTags(swagger)
  }

  for (const p in swagger.paths) {
    const pathItem = swagger.paths[p]

    for (const o in pathItem) {
      const op = pathItem[o]

      if (op.parameters) {
        for (const param of op.parameters) {
          lintParameter(param)
        }
      }
    }
  }

  applyMergePatch(swagger, exPatch)
  applyMergePatch(swagger, patch)
  jsondiffpatch.patch(swagger, swaggerFixup)
}

// code is taken from 'json-merge-patch' package and simplify to allow only adding props
function applyMergePatch (target, patch) {
  assert(_.isPlainObject(target))

  if (patch === null) {
    return
  }

  _.forEach(patch, function (value, key) {
    assert(value !== null, 'Patch tried to delete property: ' + key)

    if (_.isPlainObject(target[key])) { return applyMergePatch(target[key], value) }

    if ((_.isArray(target[key])) && (_.isArray(value))) { return target[key].concat(value) }

    if ((typeof target[key] !== 'undefined') && (target[key] === value)) { return value }

    if (key === 'x-providerName') { return value }

    assert(_.isUndefined(target[key]), 'Patch tried to override property: ' + key + ' ' + target[key] + ' ' + value)
    target[key] = value
  })
}

function removeEmpty (obj) {
  if (!_.isObject(obj)) { return }

  _.forEach(obj, function (value, key) {
    removeEmpty(value)
    if (value === '' || _.isEmpty(value)) { delete obj[key] }
  })
}

function lintParameter (param) {
  _.each([
    {type: 'integer', prop: 'minLength'},
    {type: 'integer', prop: 'maxLength'},
    {type: 'string', prop: 'minimum'},
    {type: 'string', prop: 'maximum'},
    {type: 'string', prop: 'exclusiveMinimum'},
    {type: 'string', prop: 'exclusiveMaximum'},
    {type: 'string', prop: 'multipleOf'}
  ], function (bug) {
    if ((param.type === bug.type) && (typeof param[bug.prop] !== 'undefined')) { delete param[bug.prop] }
  })
  return param
}
