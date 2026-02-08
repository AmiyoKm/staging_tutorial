import axios from 'axios'
import type { AuthResponse, TodosResponse, Todo, LoginInput, RegisterInput, CreateTodoInput, UpdateTodoInput } from '@/types'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  register: async (input: RegisterInput): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/register', input)
    return data
  },

  login: async (input: LoginInput): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', input)
    return data
  },

  me: async (): Promise<{ id: number; email: string }> => {
    const { data } = await apiClient.get('/api/auth/me')
    return data
  }
}

// Todos API
export const todosApi = {
  list: async (params?: { completed?: boolean; priority?: string }): Promise<TodosResponse> => {
    const { data } = await apiClient.get<TodosResponse>('/api/todos', { params })
    return data
  },

  get: async (id: string): Promise<Todo> => {
    const { data } = await apiClient.get<Todo>(`/api/todos/${id}`)
    return data
  },

  create: async (input: CreateTodoInput): Promise<Todo> => {
    const { data } = await apiClient.post<Todo>('/api/todos', input)
    return data
  },

  update: async (id: string, input: UpdateTodoInput): Promise<Todo> => {
    const { data } = await apiClient.put<Todo>(`/api/todos/${id}`, input)
    return data
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/api/todos/${id}`)
    return data
  },

  toggleComplete: async (id: string): Promise<Todo> => {
    const { data } = await apiClient.patch<Todo>(`/api/todos/${id}/complete`)
    return data
  }
}

export default apiClient
