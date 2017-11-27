import { getSpec } from '../converter'

export function loadSpec (ctx) {
  return getSpec(ctx.source, ctx.format).then(spec => {
    ctx.spec = spec
  })
}
