import { replaceSpaces } from './utils'

const _ = require('lodash')

export function replaceSpacesInSchemaNames ({swagger}) {
  if (_.isUndefined(swagger.definitions)) {
    return
  }

  swagger.definitions = _.mapKeys(swagger.definitions, function (value, key) {
    return replaceSpaces(key)
  })
}
