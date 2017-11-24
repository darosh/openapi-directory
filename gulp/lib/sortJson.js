const sortObject = require('deep-sort-object')
const _ = require('lodash')

export function sortJson (json) {
  json = sortObject(json, function (a, b) {
    if (a === b) { return 0 }
    return (a < b) ? -1 : 1
  })

  // detect Swagger format.
  if (_.get(json, 'swagger') !== '2.0') {
    return json
  }

  const fieldOrder = [
    'swagger',
    'schemes',
    'host',
    'basePath',
    'x-hasEquivalentPaths',
    'info',
    'externalDocs',
    'consumes',
    'produces',
    'securityDefinitions',
    'security',
    'parameters',
    'responses',
    'tags',
    'paths',
    'definitions'
  ]

  const sorted = {}

  _.each(fieldOrder, function (name) {
    if (_.isUndefined(json[name])) { return }

    sorted[name] = json[name]
    delete json[name]
  })

  _.assign(sorted, json)

  return sorted
}
