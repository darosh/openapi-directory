const GOT = require('got')
const {log} = require('gulp-util')
const colors = require('chalk')
const {writeFile, readFile, readFileSync, existsSync, createReadStream, createWriteStream} = require('fs')
const {join, dirname} = require('path')
const {promisify} = require('util')
const mkdirp = require('mkdirp')
const sanitize = require('sanitize-filename')
const readFileAsync = promisify(readFile)
const {PassThrough} = require('stream')

export const cacheFirst = true
let pending = 0

export default function got (url, opt) {
  const name = fileUrl(url)
  pending++

  if (cacheFirst && existsSync(name)) {
    return readFileAsync(name, opt && opt.encoding !== null ? 'utf8' : null)
      .then(res => {
        pending--
        logFile(url)
        return {body: opt && opt.json ? JSON.parse(res) : res}
      })
  } else {
    let interval
    const req = GOT.apply(null, arguments)
    const ret = req.then(
      res => {
        pending--
        logRes(res)
        clearInterval(interval)

        const name = fileUrl(url)

        if (!store(res, name) && !res.body && (res.statusCode === 304)) {
          try {
            res.body = readFileSync(name, 'utf8')

            if (opt && opt.json) {
              res.body = JSON.parse(res.body)
            }
          } catch (ign) {}
        }

        return res
      },
      err => {
        pending--
        clearInterval(interval)
        logErr(err, url)
        throw err
      }
    )

    interval = logPending(url, req)
    return ret
  }
}

got.stream = function (url, opt) {
  console.log(url)
  pending++
  const name = fileUrl(url)

  if ((!opt || !opt.bypass) && cacheFirst && existsSync(name)) {
    pending--
    logFile(url)
    return createReadStream(name)
  } else {
    let interval

    const req = GOT.stream.apply(null, arguments)
    const dupl = new PassThrough()
    req.pipe(dupl)

    const ret = req.on('response', res => {
      pending--
      clearInterval(interval)
      logRes(res)
      store(res, name, dupl)
    })
      .on('error', err => {
        pending--
        clearInterval(interval)
        logErr(err, url)
      })

    interval = logPending(url, req)
    return ret
  }
}

function logRes (res) {
  log(`<${res.fromCache ? colors.green('cache') : colors.blue('got')}>`, colors.grey(res.url))
}

function logFile (url) {
  log(`<${colors.green('file')}>`, colors.grey(url))
}

function logStore (url) {
  log(`<${colors.cyan('store')}>`, colors.grey(url))
}

function logErr (err, url) {
  log(`<${colors.red('error')}>`, colors.red(err.message), colors.underline(url || err.url))
}

function logPending (url, req) {
  const MINUTE = 1000 * 60
  const end = Date.now() + MINUTE * 3
  const interval = setInterval(() => {
    if (!req || (Date.now() < end)) {
      log(`<${colors.yellow('pending\u2026' + pending)}>`, colors.underline(url))
    } else {
      if (req.cancel) {
        req.cancel()
        clearInterval(interval)
      } else {
        req.destroy()
        clearInterval(interval)
      }
    }
  }, MINUTE * 0.5)

  return interval
}

function fileUrl (url) {
  return join('.cache', url.split(/[/?=&:]/g).map(encodeURIComponent).map(sanitize).filter(d => d).join('/')) + '.cache'
}

function store (res, name, dupl) {
  if (!dupl && res.body) {
    mkdirp(dirname(name), (err) => {
      if (!err) {
        writeFile(name, ((typeof res.body === 'string') || (res.body instanceof Buffer))
          ? res.body
          : JSON.stringify(res.body), () => {
          logStore(name)
        })
      } else {
        throw new Error('Folder failed ' + name)
      }
    })

    return true
  } else if (dupl) {
    mkdirp(dirname(name), (err) => {
      if (!err) {
        dupl.pipe(createWriteStream(name))
        logStore(name)
      } else {
        throw new Error('Folder failed ' + name)
      }
    })
    return true
  } else {
    throw new Error('I have no idea what I am doing.')
  }
}
