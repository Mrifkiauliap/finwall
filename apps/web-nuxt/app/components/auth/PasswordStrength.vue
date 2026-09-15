<!-- app/components/auth/PasswordStrength.vue -->
<!-- Indikator kekuatan password. Aturan mengikuti `signupRequestSchema` di
     packages/shared agar konsisten dengan validasi server. -->
<script setup lang="ts">
const model = defineModel<string>({ default: "" });

const { t } = useI18n();

const rules = computed(() => [
  {
    key: "length",
    label: t("auth.PWD_RULE_LENGTH"),
    ok: model.value.length >= 6 && model.value.length <= 72,
  },
  {
    key: "upper",
    label: t("auth.PWD_RULE_UPPER"),
    ok: /[A-Z]/.test(model.value),
  },
  {
    key: "lower",
    label: t("auth.PWD_RULE_LOWER"),
    ok: /[a-z]/.test(model.value),
  },
  {
    key: "number",
    label: t("auth.PWD_RULE_NUMBER"),
    ok: /[0-9]/.test(model.value),
  },
  {
    key: "special",
    label: t("auth.PWD_RULE_SPECIAL"),
    ok: /[^a-zA-Z0-9]/.test(model.value),
  },
]);

const passed = computed(() => rules.value.filter((r) => r.ok).length);

const rating = computed(() => {
  if (!model.value) return 0;
  return passed.value;
});

const tone = computed(() => {
  if (rating.value <= 2) return { bar: "bg-expense", text: "text-expense" };
  if (rating.value <= 4) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-income", text: "text-income" };
});

const label = computed(() => {
  if (!model.value) return "";
  if (rating.value <= 2) return t("auth.PWD_WEAK");
  if (rating.value <= 4) return t("auth.PWD_MEDIUM");
  return t("auth.PWD_STRONG");
});

const hint = computed(() =>
  t("auth.PWD_REQUIREMENTS", { count: passed.value }),
);
</script>

<template>
  <div class="space-y-2" aria-live="polite">
    <div class="flex items-center gap-2">
      <div class="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          class="h-full rounded-full transition-all duration-300"
          :class="tone.bar"
          :style="{ width: `${(rating / 5) * 100}%` }"
        />
      </div>
      <span
        v-if="label"
        class="shrink-0 text-xs font-medium"
        :class="tone.text"
      >
        {{ label }}
      </span>
    </div>

    <p class="text-xs text-muted-foreground">{{ hint }}</p>

    <ul class="grid grid-cols-1 gap-1 pt-0.5 sm:grid-cols-2">
      <li
        v-for="rule in rules"
        :key="rule.key"
        class="flex items-center gap-1.5 text-xs transition-colors"
        :class="rule.ok ? 'text-income' : 'text-muted-foreground'"
      >
        <span
          class="size-1.5 shrink-0 rounded-full"
          :class="rule.ok ? 'bg-income' : 'bg-muted-foreground/40'"
          aria-hidden="true"
        />
        {{ rule.label }}
      </li>
    </ul>
  </div>
</template>
