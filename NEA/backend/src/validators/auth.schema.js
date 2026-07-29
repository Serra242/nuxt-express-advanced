const { z } = require('zod')

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(255)

const passwordSchema = z
  .string()
  .min(10)
  .max(128)

const loginRequestSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      password: z.string().min(1).max(128),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
})

const createUserRequestSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      password: passwordSchema,
      role: z.enum(['admin', 'user']),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
})

module.exports = {
  loginRequestSchema,
  createUserRequestSchema,
}