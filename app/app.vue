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
  const user = JSON.parse(storedUser);
  userState.value = user;
  logging.userId = user.id;
}

useEventListener('online', async () => {
  // await db.reqQueue.process();
});
</script>
