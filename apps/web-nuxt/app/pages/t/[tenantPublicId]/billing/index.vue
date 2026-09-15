<script setup lang="ts">
import PagePlaceholder from "@/components/common/PagePlaceholder.vue";
import WorkspaceTabs from "@/components/navigation/WorkspaceTabs.vue";

definePageMeta({
  middleware: ["tenant"],
  roles: ["owner"],
});

const { t } = useI18n();
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <WorkspaceTabs class="mb-6" />
    <PagePlaceholder
      :title="t('billing.TITLE')"
      :subtitle="t('billing.SUBTITLE')"
      :description="t('billing.COMING_SOON')"
    />
  </div>
</template>
