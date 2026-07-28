const { z } = require('zod')

const taskIdSchema = z.coerce
  .number()
  .int()
  .positive()

const taskTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)


const taskIdRequestSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    id: taskIdSchema,
  }),
  query: z.object({}).passthrough(),
})

const createTaskRequestSchema = z.object({
  body: z
    .object({
      title: taskTitleSchema,
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
})

const updateTaskBodySchema = z
  .object({
    title: taskTitleSchema.optional(),
    done: z.boolean().optional(),
  })
  .strict()
  .refine(
    (body) => Object.keys(body).length > 0,
    {
      message: 'Debe enviarse al menos un cambio',
    },
  )

const updateTaskRequestSchema = z.object({
  body: updateTaskBodySchema,
  params: z.object({
    id: taskIdSchema,
  }),
  query: z.object({}).passthrough(),
})

const listTasksRequestSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    done: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    title: z
      .string()
      .trim()
      .min(1)
      .optional(),
  }),
})


module.exports = {
  taskIdSchema,
  taskTitleSchema,
  taskIdRequestSchema,
  createTaskRequestSchema,
  updateTaskBodySchema,
  updateTaskRequestSchema,
  listTasksRequestSchema,
}