<template>
  <div class="relative flex">
    <div class="flex flex-col h-screen">
      <NuxtLink to="/">
        <div class="flex items-center h-14 bg-slate-800">
          <span class="text-slate-100 font-bold text-lg pl-4"> LOGO </span>
          <span class="text-slate-100 pl-2"> name </span>
        </div>
      </NuxtLink>

      <nav class="flex flex-1 w-64 bg-slate-600">
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
      class="relative flex flex-col w-full h-screen overflow-y-auto overflow-x-hidden"
    >
      <nav
        class="relative flex items-center justify-between h-14 w-full bg-slate-50 border-b border-slate-300"
      >
        <ul class="flex pl-6 text-slate-500 tracking-wide"></ul>
        <ul
          ref="userMenuButtonEl"
          @click="toggleUserMenu"
          class="flex h-14 items-center"
        >
          <user-icon />
        </ul>
      </nav>
      <div
        ref="userMenuEl"
        v-if="userMenu"
        class="absolute right-0 top-14 z-20 mt-0.5 py-2 px-3 w-32 bg-white border border-slate-300 border-r-0 rounded-r-none rounded-sm"
      >
        <ul class="flex flex-col text-slate-500">
          <NuxtLink
            @click="toggleUserMenu"
            to="/settings"
            class="flex items-center my-1"
          >
            <component :size="20" :is="Settings" />
            <li class="ml-2">Settings</li>
          </NuxtLink>
          <span class="h-px mx-1 my-1 bg-slate-100"></span>
          <NuxtLink
            @click="toggleUserMenu"
            to="/login"
            class="flex items-center my-1"
          >
            <component :size="20" :is="Logout" />
            <li class="ml-2">Logout</li>
          </NuxtLink>
        </ul>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import Dashboard from 'vue-material-design-icons/ViewDashboard.vue';
import Domain from 'vue-material-design-icons/Domain.vue';
import Employees from 'vue-material-design-icons/AccountMultiple.vue';
import Groups from 'vue-material-design-icons/FormatListGroup.vue';
import Templates from 'vue-material-design-icons/FileTableBox.vue';
import Settings from 'vue-material-design-icons/Cog.vue';
import Logout from 'vue-material-design-icons/Logout.vue';
const currentRoute = useRoute();

const routes = [
  {
    id: 0,
    url: '/timeline',
    text: 'Timeline',
    icon: Dashboard
  }
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

useEventListener('click', closeUserMenuListener);
</script>
