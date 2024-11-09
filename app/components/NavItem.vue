<template>
  <li :class="[
    currentRoute.path === url ? 'bg-slate-500/80' : 'bg-transparent',
    selected && subroutes ? 'mb-3' : ''
  ]" class="w-auto hover:bg-slate-500/30 transition-all duration-300">
    <NuxtLink @click="$emit('toggle', id)" :to="subroutes ? subroutes[0].url : url"
      class="flex w-full h-full items-center px-3">
      <component :is="icon" />
      <span class="w-full h-full pl-4 py-3">
        {{ text }}
      </span>
      <menu-right v-if="subroutes" :class="[selected ? 'origin-center rotate-90' : '']" class="transition-transform" />
    </NuxtLink>

    <ul v-if="subroutes" :style="[`height: ${selected ? 52 * subroutes.length : 0}px`]"
      class="overflow-hidden transition-all duration-300">
      <li v-for="subroute in subroutes" :class="[
        currentRoute.path === subroute.url ? 'bg-slate-500' : 'bg-transparent'
      ]" class="w-auto">
        <NuxtLink :to="subroute.url" class="flex w-full h-full items-center px-6">
          <component :is="subroute.icon" />
          <span class="w-full h-full pl-4 py-3">
            {{ subroute.text }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </li>
</template>

<script setup lang="ts">
import MenuRight from 'vue-material-design-icons/MenuRight.vue';

defineProps<{
  id: number;
  url: string;
  text: string;
  icon: any;
  subroutes?: any;
  selected?: boolean;
}>();

defineEmits<{ (e: 'toggle', id: number): void }>();

const currentRoute = useRoute();
</script>
