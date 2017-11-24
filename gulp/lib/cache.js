require('events').defaultMaxListeners = 64

const DB = require('@keyv/sqlite')
export const cache = new DB('sqlite://.cache/http.sqlite')
