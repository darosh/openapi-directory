const GOT = require('got')
const {log} = require('gulp-util')
const colors = require('chalk')
const {writeFile, readFile, readFileSync, stat, createReadStream, createWriteStream} = require('fs')
const {join, dirname} = require('path')
const {promisify} = require('util')
const mkdirp = require('mkdirp')
const sanitize = require('sanitize-filename')
const readFileAsync = promisify(readFile)
const {PassThrough} = require('stream')

export let cacheFirst = true
let pending = 0

export function setCacheFirst (value) {
  cacheFirst = value
}

export default function got (url, opt, bypass) {
  const name = fileUrl(url)
  pending++

  if (cacheFirst && !bypass) {
    return readFileAsync(name, opt && opt.encoding !== null ? 'utf8' : null)
      .then(
        res => {
          pending--
          logFile(url)
          return {body: opt && opt.json ? JSON.parse(res) : res}
        },
        () => {
          return got(url, opt, true)
        }
      )
  } else {
    let interval
    const req = GOT.apply(null, arguments)
    const ret = req.then(
      res => {
        pending--
        logRes(res, url)
        clearInterval(interval)

        const name = fileUrl(url)

        if (!store(res, name) && !res.body && (res.statusCode === 304)) {
          try {
            console.log('sync')
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
  pending++
  const name = fileUrl(url)
  const proxy = new PassThrough()

  if ((!opt || !opt.bypass) && cacheFirst) {
    stat(name, (err) => {
      if (err) {
        streamRequest(proxy, name, url, opt)
      } else {
        streamCache(proxy, name)
      }
    })
  } else {
    streamRequest(proxy, name, url)
  }

  return proxy
}

function streamCache (proxy, name) {
  pending--
  createReadStream(name).pipe(proxy)
  setImmediate(() => {
    proxy.emit('response', {fromCache: true})
  })
}

function streamRequest (proxy, name, url, opt) {
  let interval
  const req = GOT.stream(url, opt)
  const dupl = new PassThrough()

  req.pipe(dupl)

  const ret = req
    .on('response', res => {
      pending--
      clearInterval(interval)
      logRes(res, url)
      store(res, name, dupl)
      proxy.emit('response', res)
    })
    .on('error', err => {
      pending--
      clearInterval(interval)
      logErr(err, url)
      proxy.emit('error', err)
    })

  interval = logPending(url, req)

  ret.pipe(proxy)
}

function logRes (res, url) {
  log(`<${res.fromCache ? colors.green('cache') : colors.blue('got')}>`, colors.grey(url))
}

function logFile (url) {
  log(`<${colors.green('file')}>`, colors.grey(url))
}

function logStore (url) {
  log(`<${colors.yellow('store')}>`, colors.grey(url))
}

function logErr (err, url) {
  log(`<${colors.red('error')}>`, colors.red(err.message), colors.underline(url))
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
  mkdirp(dirname(name), (err) => {
    if (!err) {
      if (!dupl && res.body) {
        writeFile(name, ((typeof res.body === 'string') || (res.body instanceof Buffer))
          ? res.body
          : JSON.stringify(res.body), () => {
        })
      } else if (dupl) {
        dupl.pipe(createWriteStream(name))
      }

      logStore(name)
    } else {
      throw new Error('Folder failed ' + name)
    }
  })

  return (!dupl && res.body) || dupl
}
