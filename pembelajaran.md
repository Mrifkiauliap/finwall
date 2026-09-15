# Pembelajaran & Catatan Pengalaman (Experiments Log)

## 1. Auto-formatting Kode Undangan Join Workspace

- **Masalah**: Input kode undangan perlu format `XXXX-XXXX`. User ingin agar saat mengetik 4 karakter pertama, tanda hubung `-` otomatis muncul, dan jika user men-copy-paste kode (baik 8 karakter polos `XXXXXXXX` maupun `XXXX-XXXX`), format otomatis disesuaikan tanpa karakter ganda.
- **Solusi**:
  - Menggunakan fungsi `onCodeInput` yang menyaring karakter non-alphanumeric, mengonversi ke kapital, membatasi panjang maksimal 8 karakter alphanumeric.
  - Memanfaatkan `e.inputType !== 'deleteContentBackward'` untuk mendeteksi aksi penghapusan (Backspace), sehingga saat user menghapus tanda `-`, input tidak memaksakan `-` kembali dan menghalangi user menghapus karakter ke-4.

## 2. Penggunaan Icon pada NotificationItem

- **Masalah**: Penggunaan `<Icon name="lucide:..." />` di `NotificationItem.vue` tidak muncul / tidak bekerja karena `@nuxt/icon` (modul Nuxt Icon) tidak terinstall di dalam project.
- **Solusi**: Mengimpor langsung icon Vue dari paket `lucide-vue-next` (`Info`, `CircleCheck`, `TriangleAlert`, `CircleX`, `X`) dan merendernya secara dinamis menggunakan `<component :is="icon" />`.

## 3. Sinkronisasi Timer Auto-Dismiss Notifikasi dengan Hover Cursor

- **Masalah**: Notifikasi langsung tertutup padahal bar durasi visual masih sisa setengah jika user sempat melakukan hover cursor. Penyebabnya adalah `setTimeout` di JavaScript (`useNotification.ts`) terus berjalan di background tanpa jeda, sedangkan animasi CSS durasi (`.progress-timer`) di-pause saat `:hover`.
- **Solusi**: Menghapus `setTimeout` kaku di `useNotification.ts` dan mendengarkan event `@animationend` langsung dari elemen progress bar CSS (`NotificationItem.vue`). Saat hover, animasi CSS pause dan timer JS tidak memicu dismiss prematur. Saat unhover, animasi berlanjut hingga usai (100%) dan baru memicu event `@animationend` untuk mentrigger `emit('dismiss')`.

## 4. Single Root Node pada Page Components saat Transisi Halaman (Nuxt & Vue Transition)

- **Masalah**: Saat berpindah antar halaman settings (`profile.vue`, `preferences.vue`, `security.vue`) dari `SettingsNav.vue`, konten halaman tidak berganti/keload dan muncul warning di console: `[Vue warn]: Component inside <Transition> renders non-element root node that cannot be animated`. Hal ini terjadi karena Nuxt 4 mengaktifkan `pageTransition` dengan `mode="out-in"`, sedangkan template komponen halaman memiliki lebih dari satu elemen root (fragment multi-root).
- **Solusi**: Membungkus seluruh elemen template pada setiap komponen halaman settings (`profile.vue`, `preferences.vue`, `security.vue`) ke dalam satu pembungkus root tunggal (`<div class="space-y-5">...</div>`). Dengan demikian, `<Transition mode="out-in">` Vue dapat menganimasikan perpindahan komponen secara mulus tanpa kegagalan render.

## 5. Arah Animasi Slide AccountsPanel (Toggle Expand/Collapse Sidebar)

- **Masalah**: Animasi slide pembuka dan penutup panel akun di desktop `default.vue` sebelumnya bergeser ke kiri (`translateX(-8px)`), yang terasa berlawanan dengan arah buka panel.
- **Solusi**: Memperbarui aturan CSS `transform` pada `.accounts-aside[data-open="false"] > div` menjadi `translateX(20px)` dengan `opacity: 0`. Hasilnya, saat panel dibuka (_show_), konten meluncur secara mulus dari kanan ke kiri (`translateX(20px)` ➔ `translateX(0)`), dan saat panel ditutup (_hide_), konten meluncur dari kiri ke kanan (`translateX(0)` ➔ `translateX(20px)`).
