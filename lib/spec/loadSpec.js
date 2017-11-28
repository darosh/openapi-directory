export function loadSpec (ctx) {
  const {getSpec} = require('../converter')

  return getSpec(ctx.source, ctx.format).then(spec => {
    ctx.spec = spec
  })
}
