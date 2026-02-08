<script setup lang="ts">
import { ref } from 'vue'
import type { Priority } from '@/types'
import { useCreateTodo } from '@/composables/useTodos'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Label from '@/components/ui/label/Label.vue'
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import CardContent from '@/components/ui/card/CardContent.vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { mutate: createTodo, isPending } = useCreateTodo()

const title = ref('')
const description = ref('')
const dueDate = ref('')
const priority = ref<Priority>('medium')

function handleSubmit() {
  if (!title.value.trim()) return

  createTodo({
    title: title.value,
    description: description.value || undefined,
    dueDate: dueDate.value || undefined,
    priority: priority.value
  }, {
    onSuccess: () => {
      emit('close')
      title.value = ''
      description.value = ''
      dueDate.value = ''
      priority.value = 'medium'
    }
  })
}
</script>

<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Todo</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="title">Title *</Label>
            <Input
              id="title"
              v-model="title"
              placeholder="What needs to be done?"
              required
              :disabled="isPending"
            />
          </div>
          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Input
              id="description"
              v-model="description"
              placeholder="Add details..."
              :disabled="isPending"
            />
          </div>
          <div class="space-y-2">
            <Label for="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              v-model="dueDate"
              type="date"
              :disabled="isPending"
            />
          </div>
          <div class="space-y-2">
            <Label for="priority">Priority</Label>
            <select
              id="priority"
              v-model="priority"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              :disabled="isPending"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              @click="emit('close')"
              :disabled="isPending"
            >
              Cancel
            </Button>
            <Button type="submit" :disabled="isPending || !title.trim()">
              {{ isPending ? 'Creating...' : 'Create' }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
