<template>
  <VitePwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useUserState } from './composables/state';

const userState = useUserState();
const storedUser = window.localStorage.getItem('userState');

if (storedUser) {
  userState.value = JSON.parse(storedUser);
}
</script>
