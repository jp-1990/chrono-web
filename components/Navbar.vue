<template>
  <div class="relative flex">
    <div class="flex flex-col h-screen">
      <NuxtLink to="/dashboard">
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
      class="relative flex flex-col w-full h-screen overflow-x-hidden overflow-y-auto"
    >
      <nav
        class="relative flex items-center justify-between h-14 w-full bg-slate-50 border-b border-slate-300"
      >
        <ul class="flex pl-6 text-slate-500 tracking-wide"></ul>
        <ul>
          <user-icon />
        </ul>
      </nav>
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
const currentRoute = useRoute();

const routes = [
  {
    id: 0,
    url: '/dashboard',
    text: 'Dashboard',
    icon: Dashboard
  },
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
  {
    id: 1,
    url: '/settings',
    text: 'Settings',
    icon: Settings
  }
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
</script>
