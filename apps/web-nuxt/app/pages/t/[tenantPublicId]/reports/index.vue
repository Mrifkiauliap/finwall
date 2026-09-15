<script setup lang="ts">
import PagePlaceholder from "@/components/common/PagePlaceholder.vue";

definePageMeta({
  middleware: ["tenant"],
});

const { t } = useI18n();
</script>

<template>
  <PagePlaceholder
    :title="t('reports.TITLE')"
    :subtitle="t('reports.SUBTITLE')"
    :description="t('reports.COMING_SOON')"
  />
</template>
