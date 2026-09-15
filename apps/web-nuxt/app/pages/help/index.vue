<script setup lang="ts">
import PagePlaceholder from "@/components/common/PagePlaceholder.vue";

definePageMeta({
  middleware: ["auth"],
});

const { t } = useI18n();
</script>

<template>
  <PagePlaceholder
    :title="t('help.TITLE')"
    :subtitle="t('help.SUBTITLE')"
    :description="t('help.COMING_SOON')"
  />
</template>
