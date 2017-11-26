const {src} = require('gulp')
const {join, dirname} = require('path')
const mkdirp = require('mkdirp')
const rename = require('gulp-rename')
const merge = require('merge-stream')
const awspublish = require('gulp-awspublish')
const parallelize = require('concurrent-transform')

export function s3 (files, config, cacheFileName) {
  function s3 () {
    mkdirp.sync(dirname(cacheFileName))

    // create a new publisher using S3 options
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
    const publisher = awspublish.create(config, {cacheFileName})

    // define custom headers
    const headers = {
      // TODO: setup proper caching headers
      // 'Cache-Control': 'max-age=315360000, no-transform, public'
    }

    return merge.apply(null, files.map(f => src(f[0]).pipe(prefixWithDir(f[1]))))
      .pipe(parallelize(publisher.publish(headers), 10))
      .pipe(publisher.sync())
      .pipe(publisher.cache())
      .pipe(awspublish.reporter(['delete', 'create', 'update']))
  }

  s3.description = 'Publish to S3'
  return s3

  function prefixWithDir (dir) {
    return rename(path => {
      path.dirname = join(dir, path.dirname)
      return path
    })
  }
}
