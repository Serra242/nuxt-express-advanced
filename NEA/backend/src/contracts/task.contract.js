const { z } = require('../openapi/zod')

const taskPublicContract = z
  .object({
    id: z.number().int().positive(),
    title: z.string().min(1).max(255),
    done: z.boolean(),
    createdAt: z.union([z.date(), z.string().datetime()]),
    updatedAt: z.union([z.date(), z.string().datetime()]),
  })
  .strict()
  .openapi('TaskPublic', {
    example: {
      id: 1,
      title: 'Entender qué es una API',
      done: false,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-10T10:00:00.000Z',
    },
  })

const taskListContract = z
  .array(taskPublicContract)
  .openapi('TaskList')

const taskIdParamsContract = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .openapi('TaskIdParams')

const createTaskBodyContract = z
  .object({
    title: z.string().trim().min(1).max(255),
  })
  .strict()
  .openapi('CreateTaskBody')

const updateTaskBodyContract = z
  .object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .optional(),
    done: z.boolean().optional(),
  })
  .strict()
  .refine(
    (body) => Object.keys(body).length > 0,
    {
      message: 'Debe enviarse al menos un cambio',
    },
  )
  .openapi('UpdateTaskBody')

const listTasksQueryContract = z
  .object({
    done: z.enum(['true', 'false']).optional(),
  })
  .openapi('ListTasksQuery')

const taskRefContract = z
  .object({
    id: z.number().int().positive(),
    title: z.string().min(1).max(255),
  })
  .strict()
  .openapi('TaskRef')

const taskSummaryContract = z
  .object({
    total: z.number().int().min(0),
    completed: z.number().int().min(0),
    pending: z.number().int().min(0),
  })
  .strict()
  .openapi('TaskSummary')

module.exports = {
  taskPublicContract,
  taskListContract,
  taskIdParamsContract,
  createTaskBodyContract,
  updateTaskBodyContract,
  listTasksQueryContract,
  taskRefContract,
  taskSummaryContract,
}