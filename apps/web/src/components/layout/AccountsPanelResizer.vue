<!--
  Handle drag untuk mengubah lebar panel akun (desktop saja).

  Dipisah dari `DefaultLayout` supaya markup & aksesibilitasnya (role, aria,
  keyboard, hit area) tidak mengotori template layout.

  Kenapa pointer capture, bukan `mousemove` di `document`: seluruh event
  gerakan tetap dikirim ke elemen ini walau kursor bergerak cepat keluar dari
  area handle — drag tidak "lepas" di tengah jalan, dan tidak perlu
  memasang/melepas listener global secara manual.
-->
<script setup lang="ts">
import { PANEL_MAX_WIDTH, PANEL_MIN_WIDTH, useSidebar } from '@/composables/useSidebar'
import { GripVertical } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const {
  panelWidth,
  isResizing,
  resetPanelWidth,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onResizeKeydown,
} = useSidebar()

const { t } = useI18n()
</script>

<template>
  <!--
    Memakai `role="separator"` + `aria-value*` (pola standar splitter) karena
    ini elemen interaktif yang mengubah ukuran, bukan tombol biasa.
    `tabindex="0"` membuatnya terjangkau keyboard: panah kiri/kanan menggeser,
    Enter mengembalikan ke lebar awal.
  -->
  <div
    class="group absolute inset-y-0 right-0 z-10 hidden w-1.5 cursor-col-resize touch-none select-none lg:block"
    role="separator"
    aria-orientation="vertical"
    tabindex="0"
    :aria-valuemin="PANEL_MIN_WIDTH"
    :aria-valuemax="PANEL_MAX_WIDTH"
    :aria-valuenow="panelWidth"
    :aria-valuetext="`${panelWidth}px`"
    :aria-label="t('common.workspace.RESIZE_PANEL')"
    :title="t('common.workspace.RESIZE_PANEL_HINT')"
    @pointerdown="onResizeStart"
    @pointermove="onResizeMove"
    @pointerup="onResizeEnd"
    @pointercancel="onResizeEnd"
    @keydown="onResizeKeydown"
    @dblclick="resetPanelWidth"
  >
    <!-- Garis pemisah: menebal & berwarna saat hover/drag/fokus agar area
         sentuh (1.5 = 6px) terlihat, tanpa menggeser tata letak. -->
    <span
      class="absolute inset-y-0 right-0 w-px bg-border transition-all duration-150 group-hover:w-0.5 group-hover:bg-primary group-focus-visible:w-0.5 group-focus-visible:bg-primary"
      :class="isResizing ? 'w-0.5 bg-primary' : ''"
      aria-hidden="true"
    />

    <!-- Pegangan kecil di tengah: petunjuk visual bahwa garis ini bisa digeser.
         Posisinya di DALAM tepi panel (bukan menonjol keluar) karena `<aside>`
         ber-`overflow-hidden` — apa pun yang melewati tepi akan terpotong. -->
    <span
      class="absolute top-1/2 right-0.5 flex h-8 w-3.5 -translate-y-1/2 items-center justify-center rounded-md border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      :class="isResizing ? 'opacity-100' : ''"
      aria-hidden="true"
    >
      <GripVertical class="size-3" />
    </span>

    <!-- Indikator lebar saat digeser, mis. `320px`. -->
    <span
      v-if="isResizing"
      class="absolute top-3 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-medium text-background tabular-nums shadow-md"
      aria-hidden="true"
    >
      {{ panelWidth }}px
    </span>
  </div>
</template>

<style scoped>
/* Kursor col-resize dipaksa ke seluruh halaman selama drag agar tidak
   berkedip saat kursor melewati elemen lain. */
:global(html.panel-resizing),
:global(html.panel-resizing *) {
  cursor: col-resize !important;
  user-select: none !important;
}
</style>
