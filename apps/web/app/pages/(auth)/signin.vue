<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { toTypedSchema } from "@vee-validate/zod";
import { Eye, EyeOff, Loader2, Lock, LogIn, User } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { z } from "zod";

definePageMeta({
  layout: false,
  middleware: "guest",
});

const authStore = useAuthStore();

// Toggle intip password
const showPassword = ref(false);
const errorMessage = ref<string | null>(null);

// Skema validasi Zod
const signinSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, { message: "Email atau Username wajib diisi" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});

// Setup form dengan VeeValidate & Zod
const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(signinSchema),
  initialValues: {
    identifier: "",
    password: "",
  },
});

const [identifier, identifierProps] = defineField("identifier");
const [password, passwordProps] = defineField("password");

// Handler Submit Form
const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = null;

  try {
    await authStore.signIn({
      identifier: values.identifier,
      password: values.password,
    });

    // Full navigation agar NuxtLayout di-remount dengan benar.
    // Client-side router.push dari halaman layout:false → layout default
    // tidak me-trigger remount layout, sehingga sidebar hilang sampai refresh.
    if (authStore.currentTenant?.publicId) {
      await navigateTo("/dashboard", { external: true });
    } else {
      await navigateTo("/onboarding/create-workspace", { external: true });
    }
  } catch (err: any) {
    const backendMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Gagal masuk. Periksa kembali kredensial Anda.";
    errorMessage.value = backendMessage;
  }
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-8"
  >
    <div class="w-full max-w-md space-y-6">
      <!-- Header Brand -->
      <div class="text-center space-y-2">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg mb-2"
        >
          <LogIn class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">
          Masuk ke Finwall
        </h1>
        <p class="text-sm text-muted-foreground">
          Kelola workspace dan catatan keuangan Anda dengan mudah
        </p>
      </div>

      <!-- Card Form -->
      <div
        class="bg-card text-card-foreground rounded-2xl border shadow-sm p-6 sm:p-8 space-y-6"
      >
        <!-- Error Banner jika Login Gagal dari Backend -->
        <div
          v-if="errorMessage"
          class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2"
        >
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <!-- Input Identifier (Email / Username) -->
          <div class="space-y-2">
            <label
              for="identifier"
              class="text-sm font-medium text-foreground block"
            >
              Email atau Username
            </label>
            <div class="relative">
              <span
                class="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none"
              >
                <User class="w-4 h-4" />
              </span>
              <input
                id="identifier"
                v-model="identifier"
                v-bind="identifierProps"
                type="text"
                autocomplete="username"
                placeholder="nama@email.com atau username"
                class="w-full h-10 pl-9 pr-3 rounded-lg border bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                :class="
                  errors.identifier
                    ? 'border-destructive focus-visible:ring-destructive'
                    : 'border-input'
                "
              />
            </div>
            <p
              v-if="errors.identifier"
              class="text-xs text-destructive font-medium"
            >
              {{ errors.identifier }}
            </p>
          </div>

          <!-- Input Password -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label
                for="password"
                class="text-sm font-medium text-foreground block"
              >
                Password
              </label>
              <NuxtLink
                to="/forgot-password"
                class="text-xs text-primary hover:underline font-medium"
              >
                Lupa password?
              </NuxtLink>
            </div>
            <div class="relative">
              <span
                class="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none"
              >
                <Lock class="w-4 h-4" />
              </span>
              <input
                id="password"
                v-model="password"
                v-bind="passwordProps"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full h-10 pl-9 pr-10 rounded-lg border bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                :class="
                  errors.password
                    ? 'border-destructive focus-visible:ring-destructive'
                    : 'border-input'
                "
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                tabindex="-1"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
            <p
              v-if="errors.password"
              class="text-xs text-destructive font-medium"
            >
              {{ errors.password }}
            </p>
          </div>

          <!-- Tombol Submit -->
          <button
            type="submit"
            :disabled="isSubmitting || authStore.isLoading"
            class="w-full h-10 mt-2 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm"
          >
            <Loader2
              v-if="isSubmitting || authStore.isLoading"
              class="w-4 h-4 mr-2 animate-spin"
            />
            <span>{{
              isSubmitting || authStore.isLoading ? "Memproses..." : "Masuk"
            }}</span>
          </button>
        </form>

        <!-- Footer Card -->
        <div class="text-center pt-2 border-t text-sm text-muted-foreground">
          Belum memiliki akun?
          <NuxtLink
            to="/signup"
            class="text-primary font-medium hover:underline ml-1"
          >
            Daftar sekarang
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
