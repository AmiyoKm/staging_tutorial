import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { todosApi } from '@/lib/api'
import type { CreateTodoInput, UpdateTodoInput } from '@/types'

export function useTodos(params?: { completed?: boolean; priority?: string }) {
  return useQuery({
    queryKey: ['todos', params],
    queryFn: () => todosApi.list(params)
  })
}

export function useTodo(id: string) {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: () => todosApi.get(id),
    enabled: () => !!id
  })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTodoInput) => todosApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    }
  })
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTodoInput }) =>
      todosApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    }
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    }
  })
}

export function useToggleComplete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => todosApi.toggleComplete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previous = queryClient.getQueryData(['todos'])
      queryClient.setQueryData(['todos'], (old: any) => {
        if (!old?.todos) return old
        return {
          ...old,
          todos: old.todos.map((t: any) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          )
        }
      })
      return { previous }
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['todos'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    }
  })
}
