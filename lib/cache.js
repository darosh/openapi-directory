let cache

export function getCache () {
  if (cache) {
    return cache
  }

  const Keyv = require('keyv')
  const mkdirp = require('mkdirp')
  require('events').defaultMaxListeners = 9999
  mkdirp.sync('.cache')
  return (cache = new Keyv('sqlite://.cache/http.db'))
}
