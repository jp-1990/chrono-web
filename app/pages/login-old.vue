<template>
  <div class="w-screen h-screen flex items-center">
    <div class="h-screen flex flex-col flex-1 justify-center items-center">
      <div
        class="flex flex-col rounded-sm overflow-hidden drop-shadow-sm mb-20"
      >
        <span class="text-slate-50 bg-slate-400 font-bold text-6xl px-4 pb-2">
          LOGO
        </span>
        <span class="text-slate-50 bg-slate-300 font-bold text-lg px-4 py-1">
          company name
        </span>
      </div>
      <h1 class="text-6xl mb-12 font-light text-slate-400">Welcome back!</h1>
      <section class="flex flex-col mb-16">
        <FormKit
          type="form"
          :actions="false"
          #default="{ disabled }"
          @submit="onSubmit"
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
          />
        </FormKit>
      </section>
      <NuxtLink to="/reset-password" class="text-lg text-slate-800 mb-8">
        Forgotten your password?
      </NuxtLink>
    </div>
    <div
      class="h-screen flex flex-col w-1/3 max-w-lg justify-center items-center bg-gradient-to-b from-slate-700 to-slate-500 drop-shadow-2xl"
    >
      <section class="flex flex-col px-14 items-center">
        <h1 class="text-slate-300 text-6xl font-black mb-8">New here?</h1>
        <p class="text-slate-200 text-2xl font-light text-center mb-16">
          Sign up to our shift scheduling system and free up your time for more
          important tasks!
        </p>
        <NuxtLink
          to="/create-account"
          class="bg-slate-100 px-14 py-3 rounded text-xl text-slate-700"
        >
          Learn more
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loginOld } from '~/utils/api-user';
definePageMeta({
  layout: false
});

const router = useRouter();

const errors = ref<string[]>([]);

const onSubmit = async (fields: { email: string; password: string }) => {
  errors.value = [];
  const response = await loginOld(fields);

  if (!response) {
    errors.value = ['Incorrect email or password'];
    return;
  }

  if (response) {
    window?.localStorage.setItem('token', response.token);
    window?.localStorage.setItem('tokenExpires', response.tokenExpires);

    router.push('/');
  }
};
</script>
