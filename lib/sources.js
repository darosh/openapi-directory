import * as sources from '../sources'
import { getOrigin, getOriginUrl, getProviderName, getServiceName, getSwaggerPath } from './utils'

const assert = require('assert')
const {log, colors} = require('gulp-util')
const {readFileSync} = require('fs')
const {load} = require('js-yaml')
const _ = require('lodash')

export const deletions = []

export const specSources = Object.keys(sources).reduce((r, d) => {
  r[sources[d].provider] = sources[d]
  return r
}, {})

const catalogProviders = Object.keys(specSources)

export function getCatalogsLeads (providers = catalogProviders, blacklist) {
  const black = load(readFileSync(blacklist))

  return Promise.all(providers.map(key => specSources[key]()))
    .then(results => Array.prototype.concat.apply([], results).filter(d => black.indexOf(d.info['x-origin'][0].url) === -1))
}

export function getLeadsAsync (specs, blacklist) {
  const specsByProvider = _(specs).values()
    .groupBy(swagger => swagger.info['x-providerName']).value()

  const urlLeads = _(specsByProvider).omit(catalogProviders)
    .values().flatten()
    .map(swagger => ({
      info: {
        'version': swagger.info.version,
        'x-providerName': getProviderName(swagger),
        'x-serviceName': getServiceName(swagger),
        'x-origin': getOrigin(swagger)
      }
    })).value()

  const usedCatalogs = _(specsByProvider).keys().intersection(catalogProviders).value()

  return getCatalogsLeads(usedCatalogs, blacklist)
    .then(catalogLeads => {
      let leads = _(catalogLeads).values().concat(urlLeads).value()

      leads = indexByOriginUrl(leads)

      // add new catalog leads (MER)
      for (const l in leads) {
        const lead = leads[l]
        const filename = getSwaggerPath(lead)

        if (!specs[filename]) { // we should compare on origin url
          log(colors.magenta('adding'), filename)
          specs[filename] = lead
        }
      }

      return _(specs).mapValues((swagger, filename) => {
        const lead = leads[getOriginUrl(swagger)]

        if (!lead) {
          deletions.push(filename)
        }

        return lead
      }).value()
    })
}

function indexByOriginUrl (leads) {
  return _(leads)
    .groupBy(getOriginUrl)
    .mapValues(function (array, url) {
      if (array.length > 1) {
        array = [array[array.length - 1]]
      }

      assert(_.size(array) === 1, `Duplicate leads for "${url}" URL.`)
      return array[0]
    }).value()
}
