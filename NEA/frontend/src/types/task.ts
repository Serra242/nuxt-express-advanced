export interface Task {
  id: number
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
}

export interface UpdateTaskInput {
  title?: string
  done?: boolean
}