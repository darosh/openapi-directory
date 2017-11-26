#!/usr/bin/env node

const {join} = require('path')

if (process.argv.length === 2) {
  process.argv.push('-T')
  process.argv.push('--depth')
  process.argv.push('3')
}

process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(join(__dirname, '..', 'gulpfile.babel.js'))

require('gulp-cli')()
