<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import TodoList from '@/components/todos/TodoList.vue'
import CreateTodoDialog from '@/components/todos/CreateTodoDialog.vue'
import Button from '@/components/ui/button/Button.vue'
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'

const { user, logout } = useAuth()
const showCreateDialog = ref(false)
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">Todo App</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-muted-foreground">{{ user?.email }}</span>
          <Button variant="outline" size="sm" @click="logout">
            Logout
          </Button>
        </div>
      </div>
    </header>
    <main class="container mx-auto px-4 py-8">
      <Card class="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>My Todos</CardTitle>
        </CardHeader>
      </Card>
      <div class="max-w-2xl mx-auto mt-4">
        <TodoList />
      </div>
      <Button
        class="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-lg"
        size="icon"
        @click="showCreateDialog = true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </Button>
    </main>
    <CreateTodoDialog v-if="showCreateDialog" @close="showCreateDialog = false" />
  </div>
</template>
