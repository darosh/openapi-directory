const {join} = require('path')
const {existsSync} = require('fs')

let file = './tasks.js'

if (!existsSync(join(__dirname, file))) {
  require = require('@std/esm')(module, true) // eslint-disable-line no-global-assign
  file = './tasks.mjs'
}

require(file)
