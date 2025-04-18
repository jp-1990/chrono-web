<template>
  <VitePwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useUserState } from './composables/state';
import { db } from './utils/indexeddb';
import { logging } from './utils/logging';

const { user } = useUserState();
const storedUser = await db.users.getAll();

// todo: remove
// const res = await db.reqQueue.enqueue([{} as any]);
// const val = await db.reqQueue.dequeue();
// console.log(val);

if (!Array.isArray(storedUser) && storedUser) {
  user.value = storedUser;
  logging.userId = storedUser.id;
}
</script>
