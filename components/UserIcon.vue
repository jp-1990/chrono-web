<template>
  <div class="w-12 h-12 bg-transparent mr-1 cursor-pointer">
    <div
      class="bg-slate-50 rounded-lg flex justify-center items-center h-full w-full"
    >
      <img :src="image" alt="person-placeholder" class="w-9 h-9 rounded-full" />
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  img?: string;
}>();

const image = computed(() =>
  props.img ? props.img : '/img/person-placeholder.jpg'
);
</script>
