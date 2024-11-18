<template>
  <div class="w-screen h-screen flex items-center">
    <div class="h-screen flex flex-col flex-1 justify-center items-center">
      <div class="flex flex-col rounded-sm overflow-hidden drop-shadow-sm mb-16 mt-12 sm:mt-0 sm:mb-12">
        <span class="text-slate-50 bg-slate-400 font-bold text-6xl px-4 pb-2">
          LOGO
        </span>
        <span class="text-slate-50 bg-slate-300 font-bold text-lg px-4 py-1">
          company name
        </span>
      </div>
      <h1 class="hidden sm:flex text-6xl mb-12 font-light text-slate-400">Welcome back!</h1>
      <section class="flex flex-col mb-16">
        <FormKit type="form" :actions="false" #default="{ disabled }" @submit="handleEmailLogin" form-class="w-72"
          messages-class="flex justify-center">
          <FormKit type="email" name="email" id="email" label="Email" placeholder="example@company.com"
            label-class="text-slate-700 font-normal" />
          <FormKit type="password" name="password" id="password" label="Password" placeholder="********"
            label-class="text-slate-700 font-normal" />
          <div :class="[errors.length ? 'h-1' : 'h-8']"></div>
          <FormKit type="submit" :disabled="disabled" label="Sign in"
            input-class="w-full py-2 justify-center bg-slate-700 text-xl" outer-class="mx-8"
            message-class="mb-2 !text-sm text-center" messages-class="!mt-0" :errors="errors" />
        </FormKit>
        <div class="flex items-center mb-4">
          <span class="flex flex-1 h-px bg-slate-200" />
          <span class="text-sm text-slate-400 font-light mx-3">Or</span>
          <span class="flex flex-1 h-px bg-slate-200" />
        </div>
        <google-sign-in-button class="mx-8" size="large" width="224px" @success="handleGoogleLoginSuccess"
          @error="handleGoogleLoginError"></google-sign-in-button>
      </section>
      <NuxtLink to="/reset-password" class="text-lg text-slate-800 mb-8">
        Forgotten your password?
      </NuxtLink>
    </div>

    <div
      class="h-screen hidden sm:flex flex-col w-1/3 max-w-lg justify-center items-center bg-gradient-to-b from-slate-700 to-slate-500 drop-shadow-2xl">
      <section class="flex flex-col px-14 items-center">
        <h1 class="text-slate-300 text-6xl font-black mb-8 text-center">New here?</h1>
        <p class="text-slate-200 text-2xl font-light text-center mb-16">
          Sign up to start tracking your activities!
        </p>
        <NuxtLink to="/create-account" class="bg-slate-100 px-14 py-3 rounded text-xl text-slate-700">
          Learn more
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  GoogleSignInButton,
  type CredentialResponse,
} from "vue3-google-signin";
import { useUserState } from "~/composables/state";
definePageMeta({
  layout: false
});

const errors = ref<string[]>([]);

// todo: use apirequest
// todo: refactor
// handle success event
async function handleGoogleLoginSuccess(response: CredentialResponse) {
  const { credential } = response;

  // set token to auth header: bearer <token>
  const res = await fetch(
    'http://localhost:8000/api/v1/oauth',
    {
      credentials: 'include',
      method: 'Post',
      headers: {
        // 'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
        'Content-Type': 'application/json',
        'access-control-request-headers': 'content-type',
        //   'Access-Control-Request-Headers': 'application/json'
        'Authorization': `${credential}`
      },
    }
  );
  console.log('response', res);


  const user = await res.json()

  const userState = useUserState();
  userState.value = user;

  window.localStorage.setItem('userState', JSON.stringify(user));

  await navigateTo('/timeline')
};

// todo: refactor
// handle an error event
function handleGoogleLoginError() {
  console.error("Login failed");
};

// todo: use apirequest
// todo: refactor
async function handleEmailLogin(fields: { email: string; password: string }) {
  errors.value = [];
  const response = await fetch(
    'http://localhost:8000/api/v1/login',
    {
      credentials: 'include',
      method: 'Post',
      headers: {
        // 'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
        'Content-Type': 'application/json',
        'access-control-request-headers': 'content-type'
        //   'Access-Control-Request-Headers': 'application/json'
        //   authorization: `${window.localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        email: fields.email,
        pass: fields.password,
      })
    }
  );

  if (!response) {
    errors.value = ['Incorrect email or password'];
    return;
  }

  if (response) {
    const user = await response.json()

    const userState = useUserState();
    userState.value = user;

    window.localStorage.setItem('userState', JSON.stringify(user));

    await navigateTo('/timeline')
  }
};

</script>
