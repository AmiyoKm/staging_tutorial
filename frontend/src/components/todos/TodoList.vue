<script setup lang="ts">
import { useTodos } from '@/composables/useTodos'
import TodoItem from './TodoItem.vue'
import Card from '@/components/ui/card/Card.vue'
import CardContent from '@/components/ui/card/CardContent.vue'

const { data, isLoading, error } = useTodos()
</script>

<template>
  <div class="space-y-4">
    <div v-if="isLoading" class="text-center py-8 text-muted-foreground">
      Loading todos...
    </div>
    <div v-else-if="error" class="text-center py-8 text-destructive">
      Failed to load todos
    </div>
    <div v-else-if="!data?.todos?.length" class="text-center py-8 text-muted-foreground">
      No todos yet. Create your first one!
    </div>
    <div v-else class="space-y-3">
      <TodoItem
        v-for="todo in data.todos"
        :key="todo.id"
        :todo="todo"
      />
    </div>
  </div>
</template>
