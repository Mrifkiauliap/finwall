<script setup lang="ts">
import PagePlaceholder from "@/components/common/PagePlaceholder.vue";
import WorkspaceTabs from "@/components/navigation/WorkspaceTabs.vue";

definePageMeta({
  middleware: ["tenant"],
  roles: ["owner", "admin"],
});

const { t } = useI18n();
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <WorkspaceTabs class="mb-6" />
    <PagePlaceholder
      :title="t('members.TITLE')"
      :subtitle="t('members.SUBTITLE')"
      :description="t('members.COMING_SOON')"
    />
  </div>
</template>
