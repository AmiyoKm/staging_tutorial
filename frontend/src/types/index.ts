export interface User {
  id: number
  email: string
}

export interface Todo {
  id: string
  userId: number
  title: string
  description: string | null
  dueDate: string | null
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type Priority = Todo['priority']

export interface AuthResponse {
  user: User
  token: string
}

export interface TodosResponse {
  todos: Todo[]
  total: number
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {}

export interface CreateTodoInput {
  title: string
  description?: string
  dueDate?: string
  priority?: Priority
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {}

export interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}
