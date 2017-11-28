#!/usr/bin/env node

require = require('@std/esm')(module, true) // eslint-disable-line no-global-assign

const {join} = require('path')

if (process.argv.length === 2) {
  process.argv.push('-T')
  process.argv.push('--depth')
  process.argv.push('3')
}

process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(join(__dirname, '..', 'gulpfile.js'))

require('gulp-cli')()
