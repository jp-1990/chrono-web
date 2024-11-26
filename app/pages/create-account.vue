<template>
  <div class="h-screen flex items-center overflow-auto">
    <div class="flex flex-col flex-1 justify-center items-center">
      <div
        class="hidden sm:flex flex-col rounded-sm overflow-hidden drop-shadow-sm mb-12 mt-20"
      >
        <span class="text-slate-50 bg-slate-400 font-bold text-6xl px-4 pb-2">
          LOGO
        </span>
        <span class="text-slate-50 bg-slate-300 font-bold text-lg px-4 py-1">
          company name
        </span>
      </div>
      <h1 class="text-4xl mb-4 sm:mt-0 font-light text-slate-400">Sign Up</h1>
      <section class="flex flex-col mb-12">
        <FormKit
          type="form"
          :actions="false"
          #default="{ disabled }"
          @submit="onSubmit"
          form-class="w-72"
          messages-class="flex justify-center"
        >
          <FormKit
            type="text"
            name="givenName"
            id="givenName"
            label="First Name"
            label-class="text-slate-700 font-normal"
          />
          <FormKit
            type="text"
            name="familyName"
            id="familyName"
            label="Last Name"
            label-class="text-slate-700 font-normal"
          />
          <FormKit
            type="email"
            name="email"
            id="email"
            label="Email"
            placeholder="example@company.com"
            label-class="text-slate-700 font-normal"
            validation="email"
          />
          <FormKit
            type="password"
            name="password"
            id="password"
            label="Password"
            placeholder="********"
            label-class="text-slate-700 font-normal"
            validation="required|?length:8"
          />
          <FormKit
            type="password"
            name="confirmPassword"
            id="confirm-password"
            label="Confirm Password"
            placeholder="********"
            label-class="text-slate-700 font-normal"
            validation="required"
            validation-label="Password confirmation"
          />
          <div :class="[errors.length ? 'h-1' : 'h-8']"></div>
          <FormKit
            type="submit"
            :disabled="disabled"
            label="Create Account"
            input-class="w-full py-2 justify-center bg-slate-700 text-xl"
            outer-class="mx-8"
            message-class="mb-2 !text-sm text-center"
            messages-class="!mt-0"
            :errors="errors"
          />
        </FormKit>
      </section>
      <NuxtLink to="/login" class="text-lg text-slate-800 sm:mb-20">
        Back to Sign In
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
});

const errors = ref<string[]>([]);

const onSubmit = async (fields: {
  email: string;
  password: string;
  confirmPassword: string;
  givenName: string;
  familyName: string;
}) => {
  errors.value = [];
  if (fields.password !== fields.confirmPassword) {
    errors.value = ['Passwords must match'];
    return;
  }

  // todo: use apirequest
  // todo: refactor
  const response = await fetch('http://localhost:8000/api/v1/register', {
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
      givenName: fields.givenName,
      familyName: fields.familyName
    })
  });

  if (response) {
    const user = await response.json();

    const userState = useUserState();
    userState.value = user;

    db.users.add(user);

    await navigateTo('/timeline');
  }
};
</script>
