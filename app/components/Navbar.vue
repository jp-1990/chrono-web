<template>
  <div class="relative flex w-screen h-dvh">
    <div class="flex-col hidden sm:flex h-screen">
      <NuxtLink to="/">
        <div class="flex items-center h-14 bg-slate-800">
          <span class="text-slate-100 font-bold text-lg pl-4">
            <component :size="22" :is="Logo" />
          </span>
          <span class="text-slate-100 text-lg pl-2"> CHRONO </span>
        </div>
      </NuxtLink>

      <nav class="flex flex-1 overflow-x-hidden w-64 bg-slate-600">
        <ul class="text-slate-300 font-light text-lg w-full">
          <NavItem
            v-for="route in routes"
            :id="route.id"
            :url="route.url"
            :text="route.text"
            :icon="route.icon"
            :subroutes="route.subroutes"
            :selected="route.id === openList"
            @toggle="toggleOpenList"
          />
        </ul>
      </nav>
    </div>

    <div
      class="relative flex flex-col w-full h-dvh overflow-y-auto overflow-x-hidden"
    >
      <nav
        class="relative flex basis-auto items-center justify-between sm:justify-end h-14 bg-slate-800 border-b border-slate-800"
      >
        <NuxtLink to="/" class="flex sm:hidden">
          <div class="flex items-center h-14 bg-slate-800">
            <span class="text-slate-100 font-bold text-lg pl-4">
              <component :size="22" :is="Logo" />
            </span>
            <span class="text-slate-100 text-lg pl-2"> CHRONO </span>
          </div>
        </NuxtLink>

        <ul
          ref="userMenuButtonEl"
          @click="toggleUserMenu"
          class="flex h-14 items-center mr-1"
        >
          <user-icon />
        </ul>
      </nav>

      <div class="flex flex-1 flex-col overflow-auto">
        <slot />
      </div>

      <nav
        class="flex flex-row items-center justify-center sm:hidden w-screen h-14 bg-slate-800"
      >
        <ul class="flex text-slate-300 font-light text-lg mx-1">
          <NavItemMobile
            v-for="route in mobileRoutes"
            :url="route.url"
            :text="route.text"
            :icon="route.icon"
          />
        </ul>
      </nav>
    </div>

    <div
      ref="userMenuEl"
      v-if="userMenu"
      class="absolute right-0 top-14 z-20 mt-0.5 py-1 px-3 w-32 bg-white border border-slate-300 border-r-0 rounded-r-none rounded-sm"
    >
      <ul class="flex flex-col text-slate-800">
        <NuxtLink
          @click="toggleUserMenu"
          to="/settings"
          class="flex items-center my-1"
        >
          <component :size="20" :is="Settings" />
          <li class="ml-2">Settings</li>
        </NuxtLink>
        <span class="h-px mx-1 my-1 bg-slate-100"></span>
        <NuxtLink @click="logout" to="/login" class="flex items-center my-1">
          <component :size="20" :is="Logout" />
          <li class="ml-2">Logout</li>
        </NuxtLink>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { navigateTo, useRoute } from '#imports';
import Settings from 'vue-material-design-icons/Cog.vue';
import Logout from 'vue-material-design-icons/Logout.vue';
import Logo from 'vue-material-design-icons/TimerCheckOutline.vue';
import Timeline from 'vue-material-design-icons/ChartGantt.vue';
import { db, useUserState } from '../composables/state';
import { postLogout } from '../utils/api-user';
import { useWindowEventListener } from '../composables/useEventListener';

const currentRoute = useRoute();

const { user } = useUserState();

const mobileRoutes = [
  {
    id: 0,
    url: '/timeline',
    text: 'Timeline',
    icon: Timeline
  }
  // {
  //   id: 1,
  //   url: '/test',
  //   text: 'Test',
  //   icon: Dashboard
  // }
];

const routes = [
  {
    id: 0,
    url: '/timeline',
    text: 'Timeline',
    icon: Timeline
  }
  // {
  //   id: 1,
  //   url: '/test',
  //   text: 'Test',
  //   icon: Dashboard
  // }
  // {
  //   id: 1,
  //   url: `/company`,
  //   text: 'Company',
  //   icon: Domain,
  //   subroutes: [
  //     {
  //       id: 0,
  //       url: '/company/employees',
  //       text: 'Employees',
  //       icon: Employees
  //     },
  //     {
  //       id: 1,
  //       url: '/company/groups',
  //       text: 'Groups',
  //       icon: Groups
  //     },
  //     {
  //       id: 2,
  //       url: '/company/templates',
  //       text: 'Templates',
  //       icon: Templates
  //     }
  //   ]
  // },
  // {
  //   id: 2,
  //   url: '/settings',
  //   text: 'Settings',
  //   icon: Settings
  // }
];

const openList = ref<number | undefined>(
  routes.find((r) => currentRoute.path.includes(r.url))?.id
);
const toggleOpenList = (id: number) => {
  if (openList.value === id) {
    openList.value = undefined;
    return;
  }
  openList.value = id;
};

const userMenu = ref(false);
const toggleUserMenu = () => (userMenu.value = !userMenu.value);

async function logout() {
  await postLogout();

  db.users.delete(user.value.id);

  await navigateTo('/login');
  userMenu.value = false;
}

const userMenuEl = ref(null);
const userMenuButtonEl = ref(null);

const closeUserMenuListener = (event) => {
  if (
    !(userMenuEl.value as any)?.contains(event.target) &&
    !(userMenuButtonEl.value as any)?.contains(event.target)
  ) {
    if (userMenu.value) userMenu.value = false;
  }
};

useWindowEventListener('click', closeUserMenuListener);
</script>
