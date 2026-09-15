import './assets/main.css'

import { useNotification } from '@/composables/useNotification'
import { i18n } from '@/i18n'
import { setRouter } from '@/lib/navigation'
import { installQuery } from '@/plugins/query'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useThemeStore } from '@/stores/theme'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  // Query dipasang setelah Pinia (beberapa composable query memakai store).
  installQuery(app)
  app.use(i18n)

  // Router dipakai juga oleh store/service (mis. redirect setelah 401).
  setRouter(router)

  // Preferensi tampilan diterapkan sebelum render pertama (anti-FOUC).
  useThemeStore(pinia).init()
  useLocaleStore(pinia).init()

  // Restore sesi dari httpOnly cookie SEBELUM navigasi awal diselesaikan,
  // supaya guard tidak salah menganggap user belum login saat halaman dimuat
  // ulang. Halaman root menunggu overlay loading, jadi tidak ada layar kosong.
  await useAuthStore(pinia).init()
  useNotification().consumeFlashNotification()

  app.use(router)
  await router.isReady()

  app.mount('#app')
}

void bootstrap()
