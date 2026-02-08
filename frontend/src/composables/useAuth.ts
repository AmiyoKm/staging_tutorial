import { useQuery, useMutation } from '@tanstack/vue-query'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { LoginInput, RegisterInput } from '@/types'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: () => authStore.isAuthenticated,
    retry: false,
    onSuccess: (data) => {
      authStore.user = data
    }
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      authStore.setAuth(data.token, data.user)
      router.push('/')
    }
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (data) => {
      authStore.setAuth(data.token, data.user)
      router.push('/')
    }
  })

  // Logout
  function logout() {
    authStore.clearAuth()
    router.push('/login')
  }

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isPending: loginMutation.isPending || registerMutation.isPending
  }
}
