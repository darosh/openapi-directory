#!/usr/bin/env node

const {join} = require('path')
const file = 'gulpfile.js'

if (process.argv.length === 2) {
  process.argv.push('-T')
  process.argv.push('--depth')
  process.argv.push('0')
}

process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(join(__dirname, '..', file))

require('gulp-cli')()
