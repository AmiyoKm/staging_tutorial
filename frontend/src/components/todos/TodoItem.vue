<script setup lang="ts">
import { computed } from 'vue'
import type { Todo } from '@/types'
import { useToggleComplete, useDeleteTodo } from '@/composables/useTodos'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import Badge from '@/components/ui/badge/Badge.vue'
import Button from '@/components/ui/button/Button.vue'

interface Props {
  todo: Todo
}

const props = defineProps<Props>()

const { mutate: toggleComplete, isPending: isToggling } = useToggleComplete()
const { mutate: deleteTodo, isPending: isDeleting } = useDeleteTodo()

const priorityVariant = computed(() => {
  const variants = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive'
  } as const
  return variants[props.todo.priority]
})

const isPending = computed(() => isToggling.value || isDeleting.value)

function handleToggle() {
  toggleComplete(props.todo.id)
}

function handleDelete() {
  if (confirm('Delete this todo?')) {
    deleteTodo(props.todo.id)
  }
}
</script>

<template>
  <Card :class="{ 'opacity-50': isPending || todo.completed }">
    <CardHeader>
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3 flex-1">
          <Checkbox
            :checked="todo.completed"
            @update:checked="handleToggle"
            :disabled="isPending"
            class="mt-1"
          />
          <div class="flex-1 space-y-1">
            <h3 class="font-medium" :class="{ 'line-through text-muted-foreground': todo.completed }">
              {{ todo.title }}
            </h3>
            <p v-if="todo.description" class="text-sm text-muted-foreground">
              {{ todo.description }}
            </p>
            <div class="flex items-center gap-2">
              <Badge :variant="priorityVariant">
                {{ todo.priority }}
              </Badge>
              <span v-if="todo.dueDate" class="text-xs text-muted-foreground">
                Due: {{ new Date(todo.dueDate).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          @click="handleDelete"
          :disabled="isPending"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </Button>
      </div>
    </CardHeader>
  </Card>
</template>
