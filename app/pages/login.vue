<template v-slot:default>
  <div class="relative w-screen h-screen flex items-center">
    <div class="h-screen flex flex-col flex-1 justify-center items-center">
      <div
        class="flex flex-col rounded-sm overflow-hidden drop-shadow-sm mb-12 mt-0"
      >
        <div
          class="flex flex-col h-48 w-48 rounded-[48px] items-center bg-gradient-to-t from-slate-700 to-slate-800 p-4"
        >
          <span class="text-slate-100 font-bold text-lg">
            <component :size="128" :is="Logo" />
          </span>
          <span class="text-slate-100 mt-1.5 text-lg"> CHRONO </span>
        </div>
      </div>
      <h1 class="hidden sm:flex text-6xl mb-12 font-light text-slate-400">
        Welcome back!
      </h1>
      <section class="flex flex-col mb-11">
        <FormKit
          type="form"
          :actions="false"
          #default="{ disabled }"
          @submit="handleEmailLogin"
          form-class="w-72"
          messages-class="flex justify-center"
        >
          <FormKit
            type="email"
            name="email"
            id="email"
            label="Email"
            placeholder="example@company.com"
            label-class="text-slate-700 font-normal"
          />
          <FormKit
            type="password"
            name="password"
            id="password"
            label="Password"
            placeholder="********"
            label-class="text-slate-700 font-normal"
          />
          <div :class="[errors.length ? 'h-1' : 'h-8']"></div>
          <FormKit
            type="submit"
            :disabled="disabled"
            label="Sign in"
            input-class="w-full py-2 justify-center bg-slate-700 text-xl"
            outer-class="mx-8"
            message-class="mb-2 !text-sm text-center"
            messages-class="!mt-0"
            :errors="errors"
          >
            <template v-slot:prefix>
              <div class="mr-3 w-5 h-5" v-if="loading" />
            </template>
            <template v-slot:suffix>
              <div
                class="animate-spin ml-3 w-5 h-5 rounded-[100%] border-[3px] border-slate-500 border-b-slate-300 border-l-slate-400"
                v-if="loading"
              />
            </template>
          </FormKit>
        </FormKit>

        <div class="flex items-center mb-4">
          <span class="flex flex-1 h-px bg-slate-200" />
          <span class="text-sm text-slate-400 font-light mx-3">Or</span>
          <span class="flex flex-1 h-px bg-slate-200" />
        </div>

        <div class="h-10">
          <google-sign-in-button
            class="mx-8"
            size="large"
            width="224px"
            @success="handleGoogleLoginSuccess"
            @error="handleGoogleLoginError"
          ></google-sign-in-button>
        </div>
        <div
          :class="[oauthLoading ? 'border' : '']"
          class="relative mx-14 mt-2 h-2 rounded-sm bg-white border-slate-100 overflow-hidden"
        >
          <div
            v-if="oauthLoading"
            class="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white via-slate-600 via-75% to-white animate-slide"
          ></div>
        </div>
      </section>
      <NuxtLink to="/reset-password" class="text-lg text-slate-800 mb-8">
        Forgotten your password?
      </NuxtLink>
    </div>

    <div
      class="h-screen hidden sm:flex flex-col w-1/3 max-w-lg justify-center items-center bg-gradient-to-b from-slate-700 to-slate-500 drop-shadow-2xl"
    >
      <section class="flex flex-col px-14 items-center">
        <h1 class="text-slate-300 text-6xl font-black mb-8 text-center">
          New here?
        </h1>
        <p class="text-slate-200 text-2xl font-light text-center mb-16">
          Sign up to start tracking your activities!
        </p>
        <NuxtLink
          to="/create-account"
          class="bg-slate-100 px-14 py-3 rounded text-xl text-slate-700"
        >
          Learn more
        </NuxtLink>
      </section>
    </div>

    <div
      v-if="splash?.show"
      class="absolute z-20 w-full h-full flex flex-col justify-center items-center bg-gradient-to-t from-slate-700 to-slate-800"
    >
      <div
        class="flex flex-col h-48 w-48 rounded-[48px] items-center p-4 mb-14"
      >
        <span class="text-slate-200 font-bold text-lg">
          <component :size="128" :is="Logo" />
        </span>
        <span class="text-slate-200 mt-1.5 text-lg"> CHRONO </span>
      </div>
      <h1 class="text-4xl mb-5 font-light text-slate-400">Welcome back!</h1>
      <h2 class="text-5xl text-slate-300">{{ splash?.user.givenName }}</h2>
      <div class="flex h-60 w-60"></div>
    </div>
  </div>
</template>

<style>
@keyframes slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
  }
}

.animate-slide {
  animation: slide 2s ease-in infinite;
}
</style>

<script setup lang="ts">
import { definePageMeta, useRouter } from '#imports';
import { ref } from 'vue';
import Logo from 'vue-material-design-icons/TimerCheckOutline.vue';
import {
  GoogleSignInButton,
  type CredentialResponse
} from 'vue3-google-signin';
import { db, useUserState } from '../composables/state';
import type { User } from '../types/user';
import { postLogin, postOAuth } from '../utils/api-user';

definePageMeta({
  layout: false,
  middleware: 'auth'
});

const router = useRouter();

const oauthLoading = ref<boolean>(false);
const loading = ref<boolean>(false);
const errors = ref<string[]>([]);
const splash = ref<{ show: boolean; user: User } | undefined>();

async function handleGoogleLoginSuccess(response: CredentialResponse) {
  oauthLoading.value = true;
  errors.value = [];
  // set token to auth header: bearer <token>
  const res = await postOAuth(response);
  if (!res) {
    errors.value = ['Something went wrong!'];
    oauthLoading.value = false;
    return;
  }

  const userRes = await res.json();
  userRes._refreshCheck = Date.now() + 60 * 60 * 1000;

  const userData = { ...userRes };
  if (userData.email === 'marieta.avramova@gmail.com') {
    userData.givenName = 'Panda';
  }
  splash.value = { show: true, user: userData };

  const { user } = useUserState();
  user.value = userRes;

  db.users.put(userRes);

  oauthLoading.value = false;

  await new Promise<void>((res) => {
    setTimeout(() => {
      res();
    }, 3000);
  });

  await router.replace('/timeline');
}

// todo: handle an error event
function handleGoogleLoginError() {
  console.error('Login failed');
}

async function handleEmailLogin(fields: { email: string; password: string }) {
  loading.value = true;
  errors.value = [];
  const response = await postLogin(fields);

  if (!response) {
    errors.value = ['Incorrect email or password'];
    loading.value = false;
    return;
  }

  const userRes = await response.json();
  userRes._refreshCheck = Date.now() + 60 * 60 * 1000;

  splash.value = { show: true, user: userRes };

  const { user } = useUserState();
  user.value = userRes;

  db.users.put(userRes);

  loading.value = false;

  await new Promise<void>((res) => {
    setTimeout(() => {
      res();
    }, 3000);
  });

  await router.replace('/timeline');
}
</script>
