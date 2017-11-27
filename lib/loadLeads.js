import { getLeads } from './sources'
import { getOrigin } from './utils'
import { log, colors } from 'gulp-util'

const _ = require('lodash')

export function loadLeads (specs) {
  return getLeads(specs)
    .then(leads => _.toPairs(leads))
    .then(pairs => pairs.map(([filename, lead]) => {
      if (!lead) {
        return
      }

      let origin = _.cloneDeep(getOrigin(lead))

      if (Array.isArray(origin)) {
        origin = origin.pop()
      }

      if (origin['x-apisguru-direct']) {
        const source = origin.url
        log(colors.cyan('skip'), source)
        return null
      }

      return [filename, lead]
    }).filter(d => d && d[1]))
}
