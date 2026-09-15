<!-- Input teks dengan label, ikon opsional, toggle password, pesan error, dan
     hint. Menyatukan gaya input yang sebelumnya ditulis ulang di tiap halaman. -->
<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// Beberapa field (mis. `phone`) nullable di schema, jadi model menerima
// null/undefined dan dinormalkan ke string untuk input.
const model = defineModel<string | null>({ default: '' })

const text = computed({
  get: () => model.value ?? '',
  set: (value: string) => {
    model.value = value
  },
})

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    type?: string
    placeholder?: string
    autocomplete?: string
    /** Komponen ikon Lucide di sisi kiri input. */
    icon?: unknown
    /** Tampilkan tombol lihat/sembunyikan password. */
    passwordToggle?: boolean
    /** Gaya monospace + spasi lebar (untuk kode undangan). */
    code?: boolean
    maxlength?: number
    autocapitalize?: string
    /** Kode error (i18n key di namespace `validation`). */
    error?: string
    hint?: string
    /**
     * Normalisasi nilai yang diketik. Mengembalikan nilai final.
     * Dipakai kode undangan untuk auto-format `XXXX-XXXX`.
     */
    format?: (raw: string) => string
  }>(),
  {
    type: 'text',
    placeholder: undefined,
    autocomplete: undefined,
    icon: undefined,
    passwordToggle: false,
    code: false,
    maxlength: undefined,
    autocapitalize: undefined,
    error: undefined,
    hint: undefined,
    format: undefined,
  },
)

defineOptions({ inheritAttrs: false })

const { t } = useI18n()

const revealed = ref(false)

const inputType = computed(() =>
  props.passwordToggle ? (revealed.value ? 'text' : 'password') : props.type,
)

// Terapkan `format` setiap nilai berubah, apa pun sumbernya (ketik, paste,
// autofill) — lebih andal daripada memproses event `input` mentah.
watch(text, (value) => {
  if (!props.format) return
  const formatted = props.format(value)
  if (formatted !== value) text.value = formatted
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <label :for="id" class="block text-sm font-medium text-foreground">
        {{ label }}
      </label>
      <!-- Aksi sekunder di baris label, mis. "Lupa password?". -->
      <slot name="labelAction" />
    </div>

    <div class="relative">
      <span
        v-if="icon"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
        aria-hidden="true"
      >
        <component :is="icon" class="size-4" />
      </span>

      <input
        :id="id"
        v-model="text"
        v-bind="$attrs"
        :type="inputType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :autocapitalize="autocapitalize"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
        :class="
          cn(
            'h-10 w-full rounded-lg border bg-background text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-9' : 'pl-3',
            passwordToggle ? 'pr-10' : 'pr-3',
            code &&
              'h-11 text-center font-mono text-base uppercase tracking-[0.2em] placeholder:font-sans placeholder:tracking-normal placeholder:normal-case',
            error
              ? 'border-destructive focus-visible:ring-destructive'
              : 'border-input focus-visible:ring-ring',
            $attrs.class as string,
          )
        "
      />

      <button
        v-if="passwordToggle"
        type="button"
        tabindex="-1"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
        :aria-label="revealed ? t('auth.HIDE_PASSWORD') : t('auth.SHOW_PASSWORD')"
        @click="revealed = !revealed"
      >
        <EyeOff v-if="revealed" class="size-4" />
        <Eye v-else class="size-4" />
      </button>
    </div>

    <p v-if="error" :id="`${id}-error`" class="text-xs font-medium text-destructive" role="alert">
      {{ t(`validation.${error}`) }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-xs text-muted-foreground">
      {{ hint }}
    </p>
  </div>
</template>
