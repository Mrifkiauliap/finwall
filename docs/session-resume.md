# Resume Sesi — Auth Verification, Password Hashing, App Shell

Dokumen ini merangkum pekerjaan satu sesi pada **Finwall** (Turborepo + pnpm monorepo).
Tujuannya agar sesi berikutnya bisa lanjut tanpa mengulang investigasi.

> **Status verifikasi:** semua perubahan lolos `type-check`, `lint` (0 error), `test` API (4/4),
> `build` API, dan `build` web. Verifikasi logika kritis dilakukan lewat skrip runtime Node
> (Argon2id, render template email). **Perubahan visual (scroll, animasi panel) BELUM
> dikonfirmasi di browser** — perlu dilihat manual.

---

## 1. Ringkasan perubahan

| Area                                  | Status                         |
| ------------------------------------- | ------------------------------ |
| Verifikasi email (end-to-end)         | ✅ Selesai                     |
| Hashing password → Argon2id           | ✅ Selesai, `bcryptjs` dicabut |
| Perbaikan alur token lupa-password    | ✅ Selesai                     |
| Route lupa-password yang hilang       | ✅ Selesai (sebelumnya 404)    |
| Scroll app shell (2 layout)           | ✅ Selesai                     |
| Panel akun bisa di-resize             | ✅ Selesai (desktop)           |
| Blank page saat ganti tab pengaturan  | ✅ Selesai                     |
| Perapian SettingsLayout + SettingsNav | ✅ Selesai                     |
| Animasi buka/tutup panel akun         | ✅ Selesai                     |
| Command Shell + shortcut master+key   | ✅ Selesai (sesi sebelumnya)   |
| `apps/web-nuxt`                       | ❌ **Belum disamakan**         |

---

## 2. Perintah penting

Shell di environment ini **cmd.exe**, bukan PowerShell. Gunakan `&&`, **jangan `;`**
(pnpm akan menganggap argumen setelah `;` sebagai parameter tambahan dan gagal).

```bash
# Verifikasi web
pnpm --filter @finwall/web run type-check
pnpm --filter @finwall/web run lint
pnpm --filter @finwall/web run build-only

# Verifikasi API
pnpm --filter @finwall/api run check-types
pnpm --filter @finwall/api run lint
pnpm --filter @finwall/api run test
pnpm --filter @finwall/api run build

# Paket workspace — HARUS dibuild ulang setelah mengubah paket ini,
# karena `apps/api` memakai `dist`, bukan source:
pnpm --filter @finwall/shared run build
pnpm --filter @finwall/db run build
pnpm --filter @finwall/config run build
```

### Jebakan yang sudah ditemukan

1. **`@finwall/shared` diberi ke `apps/web` lewat `types: ./src/index.ts`.** Artinya web
   meng-_type-check_ **source** shared, bukan `dist`. Modul native **tidak boleh** masuk
   barrel `src/index.ts` — lihat §5.
2. **Error TypeScript "cannot find property" setelah mengubah paket workspace** hampir selalu
   karena `dist` paket itu belum dibuild. Build dulu sebelum panik.
3. **`drizzle-kit generate` menuntut env valid.** Kalau `EMAIL_PASSWORD` kosong, generate gagal.
   Solusi: set sementara di depan perintah.
   ```bash
   set "EMAIL_PASSWORD=dummy-for-migration" && pnpm --filter @finwall/db run db:generate
   ```
4. **`del` / `dir` (cmd) bukan `Remove-Item` / `Get-ChildItem`.** PowerShell tidak tersedia
   meski sistemnya Windows 11.

---

## 3. Verifikasi email

### Alur

1. Signup → user dibuat dengan `is_verified = false`, session langsung aktif, kode 6 karakter dikirim.
2. Banner "email belum diverifikasi" muncul di bawah header `DefaultLayout`.
3. Tombol banner → `/verify-email` → masukkan kode → `is_verified = true`, banner hilang seketika.
4. Ada "kirim ulang kode" dengan cooldown 60 detik; target email diambil dari **DB**, bukan body.

### Berkas

| Berkas                                                         | Peran                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `packages/db/src/schema/users.ts`                              | Kolom `is_verified`, `email_verified_at`                           |
| `packages/db/drizzle/0001_exotic_ezekiel.sql`                  | Migrasi                                                            |
| `apps/api/src/modules/auth/auth.service.ts`                    | `verifyEmail()`, `resendVerification()`, `sendVerificationEmail()` |
| `apps/api/src/modules/auth/auth.controller.ts`                 | `POST /auth/verify-email`, `POST /auth/resend-verification`        |
| `apps/web/src/views/auth/verifyEmail/VerifyEmailView.vue`      | Halaman verifikasi                                                 |
| `apps/web/src/components/feedback/EmailVerificationBanner.vue` | Banner pengingat                                                   |

### Keputusan penting

- **Token verifikasi disimpan di DB, bukan cache.** Token sekali-pakai punya siklus hidup
  (dibuat → dipakai → dibatalkan); cache boleh hilang kapan saja. Dua sumber kebenaran untuk
  objek yang sama akan berbeda pendapat. Lookup `WHERE token_hash = ?` sudah punya unique index
  dan hanya jalan sekali per percobaan — cache tidak membeli apa pun.
- **Cache hanya untuk cooldown resend.** Semantik TTL, self-cleaning, tanpa baris DB.
- **Invalidasi cache wajib di dua namespace.** `JwtStrategy` meng-cache user di
  `user:auth:{id}` selama 15 menit, dan ada juga `user:profile:{pid}`. Keduanya memuat
  `isVerified`. Tanpa `invalidateUserCaches()`, banner tetap muncul 15 menit walau DB
  sudah benar.
- **Cooldown dipasang SETELAH email terkirim.** Kalau SMTP gagal dan cooldown sudah aktif,
  user terjebak 60 detik tanpa pernah menerima kode.

---

## 4. Hashing password → Argon2id

**`bcryptjs` dicabut total** dari `apps/api` dan `packages/db` (keputusan user: belum production,
tidak perlu fallback).

| Berkas                                      | Peran                                                         |
| ------------------------------------------- | ------------------------------------------------------------- |
| `packages/shared/src/password.ts`           | `hashPassword()`, `verifyPassword()`, `passwordNeedsRehash()` |
| `packages/shared/package.json`              | Subpath export `./password`                                   |
| `apps/api/src/modules/auth/auth.service.ts` | Signup/signin/reset memakai fungsi ini                        |
| `packages/db/src/seed/Initial.seed.ts`      | Seeder memakai fungsi yang sama                               |

### Parameter

`Algorithm.Argon2id`, `memoryCost: 19456` (19 MiB), `timeCost: 2`, `parallelism: 1` — setelan
minimum rekomendasi OWASP.

### Rehash otomatis

`passwordNeedsRehash()` dipanggil setelah login berhasil; kalau parameter sudah tidak sesuai
`ARGON2_OPTIONS`, hash dihitung ulang. Jadi menaikkan `memoryCost` di masa depan memigrasikan
user satu per satu **tanpa reset massal**. Ini satu-satunya kesempatan, karena password polos
hanya ada di titik itu.

### ⚠️ Dampak

**User lama dengan hash bcrypt tidak bisa login** — hash ditolak dan perlu reset password
(terverifikasi di runtime: `$2b$...` → `false`). Jalankan `pnpm --filter @finwall/db run db:seed`
untuk user seed baru (sudah `isVerified: true` + hash Argon2id).

---

## 5. 🔴 Modul native tidak boleh masuk barrel shared

`@node-rs/argon2` adalah modul native (Rust, napi-rs) yang **tidak bisa di-bundle untuk browser**.

- `packages/shared/src/password.ts` **sengaja TIDAK diekspor** dari `src/index.ts`.
- Hanya bisa diimpor lewat subpath: `@finwall/shared/password`.
- Diverifikasi: `argon2` **tidak ada** di `apps/web/dist/assets/*.js`.

Pakai `@node-rs/argon2`, **bukan `argon2`** — yang kedua butuh node-gyp dan sering gagal di Windows.

---

## 6. Bug yang ditemukan & diperbaiki

Setiap item di bawah ini adalah bug nyata yang sudah diperbaiki, bukan sekadar rapian.

### 6.1 Notif signin/signup tidak muncul sampai di-reload

`notifyAfterReload()` menulis ke `sessionStorage` yang hanya dibaca **sekali** di `main.ts`.
Signin/signup memakai navigasi SPA (`router.push`) yang tidak pernah reload → toast menggantung.
**Fix:** pakai `notify()` di `SignInView.vue` + `SignUpView.vue`.
`NotificationContainer` terpasang global di `App.vue` (di luar `RouterView`) sehingga tetap tampil.

### 6.2 Kode verifikasi email tidak bisa dicopy

Template dipecah jadi satu `<td>` per karakter → hasil copy `O	m	Z	8	Z	k` (tab antar sel).
**Fix:** satu text node + `letter-spacing` (jarak visual yang **tidak ikut tercopy**).
Terverifikasi: `<span>OmZ8Zk</span>` utuh.

### 6.3 Banner kontras rusak di dark mode

`text-warning-foreground` dipakai sebagai warna teks di atas tint 10%. Token itu dirancang
sebagai teks **di atas isian** `--warning` (light `0.75/0.28`, dark `0.80/0.20`) → di dark mode
teks gelap di atas latar gelap.
**Fix:** pola `ConfirmDialog` — teks netral `text-foreground`, tombol tetap
`bg-warning text-warning-foreground`.

### 6.4 Token lupa-password dibaca dari dua sumber berbeda

`verifyForgotPasswordToken()` baca **cache saja**, `resetPassword()` baca **DB saja**.
Valkey restart → token valid di DB ditolak. Kolom `usedAt` juga tidak pernah ditulis.
**Fix:** helper bersama `findActivePasswordReset()` membaca DB (filter `usedAt IS NULL` +
belum kedaluwarsa); token ditandai `usedAt` bukan dihapus; token lama dihapus saat minta kode
baru; cache hanya untuk cooldown. Simetri yang sama diterapkan ke verifikasi email.

### 6.5 🔴 Route `/forgot-password` tidak pernah terdaftar

`ForgotPasswordView.vue` dan `ResetPassword.vue` sudah ada tetapi tidak ada di router —
tautan "Lupa password?" di signin dan tombol di halaman reset **semuanya jatuh ke 404**.
**Fix:** daftarkan `/forgot-password` + `/forgot-password/reset` (keduanya `guest: true`).

### 6.6 🔴 Scroll app shell — root `min-h-dvh`

Root memakai `min-h-dvh` sehingga tidak ada batas tinggi: saat konten panjang, yang tumbuh adalah
**dokumen**, bukan `main`. Akibatnya rail (`h-dvh`) dan panel akun menjadi lebih pendek dari
halaman dan **ikut tergulung keluar layar**.

**Fix di `DefaultLayout.vue` + `SettingsLayout.vue`:**

- Root: `min-h-dvh` → **`h-dvh overflow-hidden`**
- Kolom konten: **`min-h-0`** — wajib, karena flex item default `min-height: auto` menolak
  menyusut, sehingga `main` tidak akan pernah bisa menggulung
- `main`: `min-h-0 flex-1 overflow-y-auto` → satu-satunya area yang menggulung

**Efek samping yang ikut ditangani:** `router.options.scrollBehavior` menggulung `window`,
padahal `window` tidak lagi menggulung. Ditambahkan watcher `route.fullPath` yang menggulung
`main` ke atas (di kedua layout).

### 6.7 🔴 Blank page saat ganti tab pengaturan

`App.vue` memakai `pageKey = route.name` sebagai `:key`. Setiap tab pengaturan punya nama route
sendiri (`settings-profile`, `settings-preferences`, …) → setiap klik tab **me-remount seluruh
`SettingsLayout`** termasuk `<RouterView>` bersarangnya. Dengan `mode="out-in"`, layout baru
lahir kosong saat menunggu transisi → **blank** sampai ada yang memaksa render ulang (refresh).

**Fix:** `:key` dilepas **khusus dari cabang `v-else`** (yang memuat pembungkus layout seperti
`SettingsLayout`). `:key` di cabang `DefaultLayout` **tetap dipertahankan** karena di sana
`Component` adalah halaman berdaun.

### 6.8 Animasi panel akun terasa "blank"

Regresi dari fitur resize: inner panel diubah jadi `w-full` agar ikut melebar. Akibatnya lebar
inner ikut beranimasi dari 0 → konten **menyusut/reflow setiap frame**, bukan tergeser.

**Fix:** pisahkan peran.

- `<aside>`: lebar dianimasikan CSS (`0` ↔ `var(--panel-w)`), hanya `width` yang ditransisikan.
- `.panel-content`: lebar **tetap** `var(--panel-w)`, jadi konten tidak menyusut selama animasi.
- `overflow-x: clip` + `overflow-y: visible` (bukan `hidden`) — `hidden` memotong pegangan
  resize yang menonjol keluar tepi panel.

---

## 7. Panel akun bisa di-resize

State lebar ada di **`useSidebar.ts`** (digabung, bukan composable terpisah — ia state dari
panel yang sama).

|           |                                                                                      |
| --------- | ------------------------------------------------------------------------------------ |
| Min / Max | `224px` / `448px`                                                                    |
| Default   | `288px` (18rem, lebar lama `w-72`)                                                   |
| Cara      | Drag handle, atau fokus + `←`/`→` (Shift = 4× langkah)                               |
| Reset     | Klik ganda, atau `Enter`                                                             |
| Persist   | `localStorage` (`finwall:accounts-panel-width`), ditulis **hanya saat drag selesai** |
| Mobile    | Tidak berubah — panel akun di BottomNav, tidak punya lebar sendiri                   |

Berkas: `composables/useSidebar.ts`, `components/layout/AccountsPanelResizer.vue`.

### Keputusan teknis

- **`setPointerCapture`**, bukan listener `mousemove` global — gerakan tetap terkirim ke handle
  walau kursor cepat keluar area, jadi drag tidak "lepas" di tengah.
- **Clamping terpusat** — nilai `localStorage` rusak tidak bisa keluar dari rentang aman.
- **`transition: none` saat drag** — tanpa ini panel terasa "tertinggal" (masih dianimasikan
  320ms saat mengikuti kursor).
- **`w-72` → `w-full` → `width: var(--panel-w)`**: iterasi yang berakhir di sini. `w-72` membuat
  panel boleh melebar tapi isinya tetap 288px (ada ruang kosong di kanan).
- **`SettingsLayout` TIDAK di-resize.** `SettingsNav` punya `<aside>` sendiri (`w-64`) dan
  bukan "panel akun" — di luar scope permintaan.

---

## 8. Command Shell + shortcut master+key

### Shortcut

| Pintasan     | Aksi                                       |
| ------------ | ------------------------------------------ |
| `Ctrl` + `K` | Buka/tutup Command Shell                   |
| `Ctrl` + `B` | Buka/tutup panel akun                      |
| `Ctrl` + `D` | Ke Dashboard (tenant-scoped)               |
| `Ctrl` + `S` | Ke Pengaturan akun                         |
| `Ctrl` + `I` | Ganti tema terang/gelap                    |
| `Ctrl` + `O` | **Ganti master pintasan** (`Ctrl` ⇄ `Alt`) |

Juga bekerja dalam mode **chord** seperti VS Code: tekan master lalu lepas, kemudian tekan
tombol kedua dalam 1,8 detik.

### ⚠️ `Win + <huruf>` tidak mungkin dipakai

Kombinasi `Win + I`, `Win + S`, `Win + D` **ditangkap sistem operasi** Windows sebelum sampai ke
browser. `preventDefault()` mustahil dijalankan — ini batas platform, bukan bug. Karena itu `Win`
(Meta) **tidak dijadikan master di Windows/Linux**; hanya tersedia di macOS (`⌘`).

Listener juga dibuat ketat: `Shift` ditolak (agar `Ctrl+Shift+I`, `Ctrl+Shift+Del` tidak
termakan), dua modifier sekaligus ditolak (AltGr di banyak layout keyboard).

### Berkas

`lib/shortcuts.ts`, `composables/useShortcuts.ts`, `config/shortcuts.ts`,
`composables/useCommandShell.ts`, `components/feedback/CommandShell.vue`.
Handler dipasang sekali di `App.vue`; hanya aktif saat user autentikasi.

---

## 9. Perapian SettingsLayout + SettingsNav

- **Reset posisi gulung antar-tab** — `SettingsLayout` punya scroll container sendiri (`<main>`),
  sedangkan `scrollBehavior` router hanya menggulung `window`.
- **`sticky` dilepas dari header** — header bukan bagian area yang menggulung, jadi `sticky`
  tidak memberi efek apa pun.
- **Lebar konten** — `max-w-3xl mx-auto` dipindah dari `<main>` (yang menggulung) ke `<div>` di
  dalam, agar padding tidak ikut terhitung dalam lebar maksimum.
- **`description` akhirnya ditampilkan** — `useSettingsNav` sudah menyelesaikannya tapi tidak
  pernah dipakai di template, padahal itu yang membedakan "Profil" vs "Preferensi" vs "Keamanan".
- **Ikon dalam kotak lembut** + kondisi aktif lebih tegas (`text-sidebar-accent-foreground` + `shadow-sm`).
- **Tab mobile**: indikator garis bawah mengikuti pola `BottomNav`, `py-2.5` agar area sentuh
  layak, scrollbar disembunyikan.

---

## 10. Email template

`apps/api/src/modules/email/template-email.ts` — dirender ulang agar konsisten dengan aplikasi
(token teal, Inter, surface hangat, radius 16px), dengan **tabel design token ↔ hex di komentar**
agar mudah disinkronkan.

- Layout pakai `<table>` bersarang, bukan flexbox — Outlook tidak mendukung flexbox/grid/`var()`.
- Warna ditulis sebagai hex literal karena CSS custom property tidak didukung email client.
- **Plain-text fallback disusun manual**, bukan hasil strip tag HTML (strip menyisakan seluruh isi
  atribut `style` dan berantakan).
- Preheader + `x-apple-disable-message-reformatting` ditambahkan.

### Routing provider email

`apps/api/src/modules/email/email.service.ts`: `RESEND_API_KEY` **menang atas SMTP**.
Penting: Resend **tidak melempar error HTTP** — ia mengembalikan `{ error }`, jadi hasilnya
diperiksa manual agar kegagalan tidak diam-diam.

---

## 11. Utang teknis & hal yang belum selesai

1. **`apps/web-nuxt` belum disamakan** — masih `bcryptjs`, belum ada verifikasi email, layout
   belum diperbaiki.
2. **User enumeration di lupa-password.** `forgotPassword()` melempar `'User tidak ditemukan'`,
   padahal signin sengaja memakai pesan generik. Ini bertentangan dengan postur keamanan di kode
   yang sama. **Sengaja dibiarkan** sesuai keputusan user — perlu dikerjakan sebelum production.
3. **`EMAIL_PASSWORD` wajib di schema env** walau memakai Resend. Isi nilai apa saja bila SMTP
   tidak dipakai.
4. **`EMAIL_FROM` wajib memakai domain terverifikasi** di Resend.
5. **Perubahan visual belum dikonfirmasi di browser** — scroll app shell dan animasi panel
   akun perlu dilihat manual (termasuk saat `prefers-reduced-motion: reduce`).
6. **`main.css` memakai Google Fonts `Inter`**; email juga menyebut Inter — pastikan konsisten
   bila font diganti.

---

## 12. Peta berkas (yang disentuh sesi ini)

```
apps/api/src/
  core/utils/crypto.ts                    + generateVerifyEmailToken()
  core/strategies/jwt.strategies.ts       + isVerified, emailVerifiedAt di cache payload
  modules/auth/auth.service.ts            verifikasi email, token DB, Argon2id
  modules/auth/auth.controller.ts         + verify-email, resend-verification
  modules/auth/auth.service.spec.ts       + provider EmailService, mock password
  modules/email/email.service.ts          routing Resend
  modules/email/template-email.ts         render ulang + plain-text

apps/web/src/
  App.vue                                 :key dilepas di cabang pembungkus layout
  layouts/DefaultLayout.vue               app shell scroll + animasi panel
  layouts/SettingsLayout.vue              app shell scroll + reset gulung + rapian
  components/layout/AccountsPanelResizer.vue   BARU
  components/feedback/EmailVerificationBanner.vue  BARU
  components/settings/SettingsNav.vue     deskripsi item, ikon, tab mobile
  composables/useSidebar.ts               + state lebar panel
  composables/useCommandShell.ts          BARU
  composables/useShortcuts.ts             BARU
  config/shortcuts.ts                     BARU
  lib/shortcuts.ts                        BARU
  components/feedback/CommandShell.vue    palet perintah
  views/auth/verifyEmail/VerifyEmailView.vue    BARU
  router/index.ts                         + verify-email, + forgot-password (2 route)
  i18n/locales/{en,id}/{auth,common}.ts   kunci baru
  views/auth/{SignInView,SignUpView}.vue  notify, bukan notifyAfterReload
  views/auth/forgotPassword/*.vue         i18n + token warna

packages/
  db/src/schema/users.ts                  + is_verified, email_verified_at
  db/drizzle/0001_exotic_ezekiel.sql      migrasi
  db/src/seed/Initial.seed.ts             Argon2id + isVerified: true
  shared/src/password.ts                  BARU
  shared/src/schemas/{auth,user}.ts       skema verifikasi email
  config/src/apiConfig.ts                 + EMAIL_FROM
```

---

## 13. Cara memverifikasi ulang setelah perubahan

```bash
# 1. Kalau menyentuh paket workspace, build dulu
pnpm --filter @finwall/shared run build
pnpm --filter @finwall/db run build
pnpm --filter @finwall/config run build

# 2. API
pnpm --filter @finwall/api run check-types
pnpm --filter @finwall/api run lint
pnpm --filter @finwall/api run test
pnpm --filter @finwall/api run build

# 3. Web
pnpm --filter @finwall/web run type-check
pnpm --filter @finwall/web run lint
pnpm --filter @finwall/web run build-only

# 4. Cek modul native tidak bocor ke bundle web (harus "OK")
pnpm exec node -e "const fs=require('fs');const d='apps/web/dist/assets';const h=fs.readdirSync(d).filter(f=>f.endsWith('.js')&&fs.readFileSync(d+'/'+f,'utf8').includes('argon2'));console.log(h.length?'LEAKED: '+h.join(', '):'OK: argon2 tidak ada di bundle web');"
```

### Uji runtime Argon2 (tanpa DB)

```bash
pnpm --filter @finwall/api exec node --input-type=module -e "
import { hashPassword, verifyPassword, passwordNeedsRehash } from '@finwall/shared/password';
const h = await hashPassword('Password123!');
console.log('prefix ok      :', h.startsWith('\$argon2id\$'));
console.log('verify correct :', await verifyPassword('Password123!', h));
console.log('verify wrong   :', await verifyPassword('WrongPass1!', h));
console.log('needs rehash   :', passwordNeedsRehash(h));
console.log('legacy bcrypt  :', await verifyPassword('Password123!', '\$2b\$10\$abcdefghijklmnopqrstuv'));
"
```

### Uji render template email

```bash
cd apps/api && pnpm exec node --input-type=module -e "
import { buildVerifyEmailTemplate } from './src/modules/email/template-email.ts';
const t = buildVerifyEmailTemplate('OmZ8Zk','johndoe','id');
const m = /<td align=\"center\" style=\"padding:0 16px 20px;\">\s*<!--[\s\S]*?-->\s*<span[\s\S]*?>([^<]*)<\/span>/.exec(t.html);
console.log('kode utuh:', m?.[1] === 'OmZ8Zk');
"
```
