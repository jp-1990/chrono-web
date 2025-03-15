<template>
  <div>HOME</div>
</template>
<script setup lang="ts">
import { useAuthCheck } from '../composables/useAuthCheck';

useAuthCheck();
</script>
