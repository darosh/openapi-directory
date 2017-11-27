# OpenAPI Directory Tools

## Development

```bash
$ npm run lint
```

## Refactoring Notes

### Code

- [x] replace `wget` and `makeRequest` with [got](https://github.com/sindresorhus/got) with RFC compliant caching (using file based SQL Lite)
- [x] replace all synchronous calls for faster pipeline
- [x] parallel downloads and `git log`
- [x] use ES6 via `gulpfile.babel.js` (eventually [@std/esm](https://github.com/standard-things/esm))
- [x] use native features where possible (`URL`, `Promise`, `promisify`, ...)
- [x] streamed `tar.gz` file list reading

### CI

- [x] [Travis caching](https://docs.travis-ci.com/user/caching/) for faster build
- [x] set env `FORCE_COLOR=1` for colored gulp output
- [x] set env `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`
