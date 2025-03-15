<template>
  <div class="w-11 h-11 bg-transparent cursor-pointer">
    <div
      class="bg-slate-400 rounded-lg flex justify-center items-center h-full w-full"
    >
      <img :src="image" alt="person-placeholder" class="w-10 h-10 rounded-md" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  img?: string;
}>();

const image = computed(() =>
  props.img ? props.img : '/img/person-placeholder.jpg'
);
</script>
