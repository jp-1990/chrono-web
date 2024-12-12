<template>
  <VitePwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useUserState } from './composables/state';

const { user } = useUserState();
const storedUser = await db.users.getAll();

if (!Array.isArray(storedUser) && storedUser) {
  user.value = storedUser;
  logging.userId = storedUser.id;
}

useWindowEventListener('online', async () => {
  // await db.reqQueue.process();
});
</script>
