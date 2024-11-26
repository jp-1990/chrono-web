<template>
  <VitePwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useUserState } from './composables/state';

const userState = useUserState();
const storedUser = await db.users.getAll();

if (!Array.isArray(storedUser) && storedUser) {
  userState.value = storedUser;
  logging.userId = storedUser.id;
}

useEventListener('online', async () => {
  // await db.reqQueue.process();
});
</script>
