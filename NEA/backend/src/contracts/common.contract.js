const { z } = require('../openapi/zod')

const errorResponseContract = z
  .object({
    message: z.string(),
  })
  .strict()
  .openapi('ErrorResponse')

module.exports = {
  errorResponseContract,
}