const {obj} = require('through2')

export function empty () {
  const pass = obj()
  process.nextTick(pass.end.bind(pass))
  return pass
}
