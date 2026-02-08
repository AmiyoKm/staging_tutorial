<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Label from '@/components/ui/label/Label.vue'
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import CardDescription from '@/components/ui/card/CardDescription.vue'
import CardContent from '@/components/ui/card/CardContent.vue'

const { login, register, isPending } = useAuth()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const error = ref('')

async function handleSubmit() {
  error.value = ''

  try {
    if (isLogin.value) {
      await login({ email: email.value, password: password.value })
    } else {
      await register({ email: email.value, password: password.value })
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'An error occurred'
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl font-bold">
          {{ isLogin ? 'Welcome back' : 'Create an account' }}
        </CardTitle>
        <CardDescription>
          {{ isLogin ? 'Enter your email to sign in' : 'Enter your email to create your account' }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="m@example.com"
              required
              :disabled="isPending"
            />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="8"
              :disabled="isPending"
            />
          </div>
          <div v-if="error" class="text-sm text-destructive">
            {{ error }}
          </div>
          <Button type="submit" class="w-full" :disabled="isPending">
            {{ isPending ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account') }}
          </Button>
        </form>
        <div class="mt-4 text-center text-sm">
          <button
            type="button"
            @click="toggleMode"
            class="text-primary underline-offset-4 hover:underline"
            :disabled="isPending"
          >
            {{ isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in' }}
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
