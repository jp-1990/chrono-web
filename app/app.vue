<template>
  <VitePwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { db, useUserState } from './composables/state';
import { useWindowEventListener } from './composables/useEventListener';
import { logging } from './utils/logging';

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
