import got from '../lib/got'

const {obj} = require('through2')
const {log, colors, File} = require('gulp-util')
const {readFileSync, existsSync} = require('fs')
const {URL} = require('url')
const {join} = require('path')
const mkdirp = require('mkdirp')

const PLUGIN_NAME = 'badges'

export function badge (dest) {
  mkdirp.sync(dest)
  const logo = readFileSync('branding/icon-16x16.png').toString('base64')

  return obj(function (file, enc, cb) {
    const metrics = JSON.parse(file.contents)
    const badges = [
      ['APIs in collection', metrics.numAPIs, 'orange'],
      ['Endpoints', metrics.numEndpoints, 'red'],
      ['OpenAPI specs', metrics.numSpecs, 'yellow'],
      ['Tested on', metrics.numSpecs + ' specs', 'green', logo]
    ]

    Promise.all(badges.filter(d => !existsSync(join(dest, `${escape(d[0]).toLowerCase()}.svg`))).map(b => saveShield.apply(null, b))).then(all => {
      all.forEach((res, i) => {
        const path = `${escape(badges[i][0]).toLowerCase()}.svg`
        log(PLUGIN_NAME, 'saving', colors.blue(path))
        this.push(new File({
          path,
          contents: res.body
        }))
      })

      cb()
    })
  })
}

function saveShield (subject, status, color, icon) {
  subject = escape(subject)
  status = escape(status)

  const url = new URL(`https://img.shields.io/badge/${subject}-${status}-${color}.svg`)

  if (icon) {
    url.search = `logo=data:image/png;base64,${icon}`
  }

  log(PLUGIN_NAME, 'loading', colors.blue(url.pathname))

  return got(url.toString(), {encoding: null})
}

function escape (obj) {
  return obj.toString().replace(/_/g, '__').replace(/-/g, '--').replace(/ /g, '_')
}
