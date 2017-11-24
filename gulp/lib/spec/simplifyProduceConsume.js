const SwaggerMethods = require('swagger-methods')
const _ = require('lodash')

export function simplifyProduceConsume ({swagger}) {
  const operations = _(swagger.paths).values()
    .map(path => _(path).pick(SwaggerMethods).values().value())
    .flatten().value()

  let globalProduces = swagger.produces
  let globalConsumes = swagger.consumes

  _.each(operations, function (op) {
    if (_.isUndefined(globalProduces)) {
      globalProduces = op.produces
    }

    if (_.isUndefined(globalConsumes)) {
      globalConsumes = op.consumes
    }

    if (!_.isEqual(globalProduces || null, op.produces)) {
      globalProduces = null
    }

    if (!_.isEqual(globalConsumes || null, op.consumes)) {
      globalConsumes = null
    }
  })

  if (_.isArray(globalProduces)) {
    swagger.produces = globalProduces
  }

  if (_.isArray(globalConsumes)) {
    swagger.consumes = globalConsumes
  }

  _.each(operations, function (op) {
    if (_.isEqual(swagger.produces, op.produces)) {
      delete op.produces
    }

    if (_.isEqual(swagger.consumes, op.consumes)) {
      delete op.consumes
    }
  })
}
