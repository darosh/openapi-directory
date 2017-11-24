const _ = require('lodash')

export function postValidation (ctx) {
  const validation = ctx.validation

  if (validation.warnings) {
    validation.info = []
    validation.warnings = validation.warnings.reduce((r, warning) => {
      if (((warning.code === 'UNUSED_DEFINITION') || (warning.code === 'EXTRA_REFERENCE_PROPERTIES'))) {
        validation.info.push(warning)
      } else {
        r.push(warning)
      }

      return r
    }, [])

    validation.info = validation.info.length ? validation.info : null
    validation.warnings = validation.warnings.length ? validation.warnings : null
  }

  if (validation.remotesResolved) {
    ctx.swagger = validation.remotesResolved
    delete validation.remotesResolved
  }

  ctx.warnings = ctx.warnings || []

  if (_.isEmpty(ctx.swagger.paths)) {
    ctx.warnings.push(`Missing paths.`)
  }

  if (!ctx.swagger.info.description) {
    ctx.warnings.push(`Missing description.`)
  }

  ctx.warnings = ctx.warnings.length ? ctx.warnings : null
}
