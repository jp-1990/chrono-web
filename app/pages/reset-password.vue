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
      <h1 class="text-6xl mb-9 font-light text-slate-400">
        Reset Your Password
      </h1>
      <p class="text-slate-800 text-lg mb-7">
        Enter the email address associated with your account.
      </p>
      <section class="flex flex-col mb-8">
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
            placeholder="example@company.com"
            validation="required"
            label-class="text-slate-700 font-normal"
          />
          <FormKit
            type="submit"
            :disabled="disabled"
            label="Reset Password"
            input-class="w-full py-2 justify-center bg-slate-800 text-lg"
          />
        </FormKit>
      </section>
      <p class="mb-20 text-slate-800 w-80 text-center">
        Please check your email for a password reset link and follow the
        instructions provided.
      </p>
      <NuxtLink to="/login" class="text-xl text-slate-800 mb-8"
        >Back to Sign In</NuxtLink
      >
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
});

const onSubmit = (fields: { email: string; password: string }) => {
  console.log(fields);
};
</script>
