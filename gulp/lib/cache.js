require('events').defaultMaxListeners = 9999

const DB = require('@keyv/sqlite')
export const cache = new DB('sqlite://.cache/http.sqlite')
