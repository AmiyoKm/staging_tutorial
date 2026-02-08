<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h2 class="text-2xl font-bold mb-4">Processing login...</h2>
      <p class="text-gray-500">Please wait while we authenticate you.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  const token = route.query.token as string;
  if (token) {
    authStore.setToken(token);
    router.push({ name: 'dashboard' });
  } else {
    router.push({ name: 'login', query: { error: 'oauth_failed' } });
  }
});
</script>
