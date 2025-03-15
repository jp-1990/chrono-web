<template>
  <li
    :class="[currentRoute.path === url ? 'bg-slate-500/30' : 'bg-transparent']"
    class="w-auto py-1 mx-1 rounded-md transition-all duration-300"
  >
    <NuxtLink :to="url" class="flex w-full h-full items-center px-3">
      <component :size="36" :is="icon" />
    </NuxtLink>
  </li>
</template>

<script setup lang="ts">
import { useRoute } from '#imports';

defineProps<{
  url: string;
  text: string;
  icon: any;
}>();

const currentRoute = useRoute();
</script>
