require('events').defaultMaxListeners = 9999
const Keyv = require('keyv')
const mkdirp = require('mkdirp')
mkdirp.sync('.cache')
export const cache = new Keyv('sqlite://.cache/http.sqlite')
