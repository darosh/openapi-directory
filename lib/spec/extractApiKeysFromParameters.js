const SwaggerMethods = require('swagger-methods')
const _ = require('lodash')

export function extractApiKeysFromParameters ({swagger}) {
  if (swagger.securityDefinitions || swagger.security) { return }

  function isApiKeyParam (param) {
    return _.some(
      [
        /^user[-_]?key$/i,
        /^api[-_]?key$/i,
        /^access[-_]?key$/i
      ],
      function (regExp) {
        return regExp.test(param.name)
      }
    )
  }

  let inAllMethods = true
  const apiKeys = []

  _.each(swagger.paths, function (path) {
    _(path).pick(SwaggerMethods).map('parameters').each(function (params) {
      const apiKey = _.filter(params, isApiKeyParam)

      if (_.size(apiKey) === 1) { apiKeys.push(apiKey[0]) } else { inAllMethods = false }
    })
  })

  if (!inAllMethods) {
    return
  }

  let paramName = _(apiKeys).map('name').uniq().value()

  if (_.size(paramName) !== 1) {
    return
  }

  paramName = paramName[0]

  let paramIn = _(apiKeys).map('in').uniq().value()

  if (_.size(paramIn) !== 1) {
    return
  }

  paramIn = paramIn[0]

  if (['header', 'query'].indexOf(paramIn) === -1) {
    return
  }

  // Ignore duplicates, and choose longest description.
  const paramDescription = _(apiKeys).map('description').uniq().sortBy(_.size).last()

  swagger.securityDefinitions = {}
  swagger.securityDefinitions[paramName] = {
    type: 'apiKey',
    name: paramName,
    in: paramIn,
    description: paramDescription
  }

  swagger.security = [{}]
  swagger.security[0][paramName] = []

  _.each(swagger.paths, function (path) {
    _(path).pick(SwaggerMethods).map('parameters').each(function (parameters) {
      _.remove(parameters, function (param) {
        return param.name === paramName && param.in === paramIn
      })
    })
  })
}
