const SwaggerMethods = require('swagger-methods')
const assert = require('assert')
const _ = require('lodash')

export function expandPathTemplates ({swagger}) {
  const paths = swagger.paths
  _.each(_.keys(paths), function (path) {
    function applyParameter (pathItem, name, callback) {
      function applyParameterArray (paramArray, callback) {
        const newParamArray = []
        _.some(paramArray, function (param) {
          if (param.name !== name) {
            newParamArray.push(param)
            return
          }

          assert(param.in === 'path')
          const ret = callback(param)

          if (!_.isUndefined(ret)) { newParamArray.push(ret) }
        })

        return newParamArray
      }

      pathItem.parameters = applyParameterArray(pathItem.parameters, callback)
      _(pathItem).pick(SwaggerMethods).each(function (value) {
        value.parameters = applyParameterArray(value.parameters, callback)
      })
    }

    const pathItem = paths[path]
    const originalPath = path
    let match

    while ((match = /{\+([^}]*?)}/.exec(path))) {
      const paramName = match[1]
      path = path.replace(match[0], '{' + paramName + '}')
      applyParameter(pathItem, paramName, function (param) {
        param['x-reservedExpansion'] = true
        return param
      })
    }

    const parameterNames = []

    while ((match = /{\/([^}]*?)}/.exec(path))) {
      const paramName = match[1]
      path = path.replace(match[0], '/{' + paramName + '}')
      applyParameter(pathItem, paramName, function (param) {
        assert(_.isUndefined(param.required) || param.required === false)
        param.required = true
        return param
      })
      parameterNames.unshift(paramName)
    }

    let clonePath = path
    const clonePathItem = _.cloneDeep(pathItem)

    _.each(parameterNames, function (paramName) {
      clonePath = clonePath.replace('/{' + paramName + '}', '')
      applyParameter(clonePathItem, paramName, function () {
        // delete it
      })
      paths[clonePath] = _.cloneDeep(clonePathItem)
    })

    delete paths[originalPath]
    paths[path] = pathItem
  })
}
