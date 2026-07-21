# Seger Admin Web

Dashboard admin untuk aplikasi Seger, dibangun dengan React + Vite.

## Prasyarat

- Node.js 20+
- npm
- Docker (opsional, untuk deploy container)
- Akun Dokploy (opsional, untuk deploy production)

## Development Lokal

### 1. Clone & install dependency

```bash
git clone https://github.com/NalindraDT/seger-app-admin.git
cd seger-app-admin
npm install
```

### 2. Setup environment

Salin file contoh env, lalu sesuaikan nilainya:

```bash
cp .env.example .env
```

| Variable | Keterangan |
|----------|------------|
| `PORT` | Port dev server Vite (default: `3000`) |
| `VITE_API_BASE_URL` | Base URL backend API untuk development |
| `API_BASE_URL` | Digunakan saat runtime Docker (lihat deploy) |

Contoh:

```env
PORT=3000
VITE_API_BASE_URL=http://31.97.107.17:3001/api/v1
API_BASE_URL=http://31.97.107.17:3001/api/v1
```

### 3. Jalankan dev server

```bash
npm run dev
```

Aplikasi tersedia di `http://localhost:3000` (atau port yang Anda set di `.env`).

### 4. Build production lokal

```bash
npm run build
npm run preview
```

---

## Deploy dengan Docker

Project ini sudah menyediakan `Dockerfile` multi-stage:

1. **Build stage** — `npm ci` + `npm run build`
2. **Runtime stage** — serve static file dari folder `dist/` (tanpa nginx/reverse proxy di dalam container)

Reverse proxy & SSL ditangani di luar container (misalnya oleh Dokploy/Traefik).

### Build image

```bash
docker build \
  --build-arg VITE_API_BASE_URL=http://31.97.107.17:3001/api/v1 \
  -t seger-admin-web .
```

### Run container

```bash
docker run -d \
  --name seger-admin-web \
  -p 3333:3333 \
  -e PORT=3333 \
  -e API_BASE_URL=http://31.97.107.17:3001/api/v1 \
  seger-admin-web
```

Akses: `http://localhost:3333`

---

## Deploy di Dokploy

### 1. Buat project & service

1. Login ke Dokploy
2. Buat **Project** baru (atau gunakan yang sudah ada)
3. Tambah **Application** → pilih **GitHub**
4. Pilih repository `seger-app-admin`
5. Branch: `main`
6. Build Type: **Dockerfile**

### 2. Konfigurasi port

| Setting | Nilai |
|---------|-------|
| Container Port | `3333` (sesuai `PORT` env Anda) |
| Published Port | biarkan Dokploy/Traefik yang atur |

### 3. Environment variables

Tambahkan di **Runtime Environment**:

```env
PORT=3333
API_BASE_URL=http://31.97.107.17:3001/api/v1
```

Tambahkan di **Build Environment** (opsional, fallback saat build):

```env
VITE_API_BASE_URL=http://31.97.107.17:3001/api/v1
```

> **Prioritas URL API**
>
> 1. `API_BASE_URL` (runtime) — **prioritas utama**, bisa diubah tanpa rebuild
> 2. `VITE_API_BASE_URL` (build-time) — fallback jika runtime belum tersedia

Saat container start, `docker-entrypoint.sh` akan:

- Menulis `config.js`
- Menyuntikkan inline config ke `index.html`

sehingga frontend selalu membaca URL API yang benar.

### 4. Domain & HTTPS

1. Buka tab **Domains** di service frontend
2. Tambahkan domain, contoh: `seger-web.potydev.cloud`
3. Aktifkan **HTTPS / Let's Encrypt**
4. Deploy ulang service

Reverse proxy SSL ditangani oleh Dokploy — **tidak perlu nginx di dalam Dockerfile**.

### 5. Deploy

Klik **Deploy** / **Redeploy** setelah:

- Mengubah environment variable
- Push commit baru ke GitHub

---

## Backend API (penting)

Frontend memanggil backend lewat `API_BASE_URL`. Pastikan backend sudah running dan dapat diakses.

### Jika frontend HTTPS

| API URL | Status |
|---------|--------|
| `https://domain-api-valid.com/api/v1` | ✅ Disarankan |
| `http://IP:3001/api/v1` | ❌ Mixed Content (diblokir browser) |

**Solusi:** pasang domain + SSL valid untuk backend API di Dokploy (contoh: `seger-api.potydev.cloud`), lalu set:

```env
API_BASE_URL=https://seger-api.potydev.cloud/api/v1
```

Pastikan sertifikat **Let's Encrypt**, bukan Traefik Default Cert (self-signed).

---

## Verifikasi setelah deploy

### 1. Cek runtime config

Buka di browser:

```
https://<domain-frontend-anda>/config.js
```

Harus menampilkan:

```javascript
window.__APP_CONFIG__ = {
  API_BASE_URL: "http://31.97.107.17:3001/api/v1"
};
```

### 2. Cek inline config di HTML

View Page Source (`Ctrl+U` / `Cmd+Option+U`), pastikan ada:

```html
<script>window.__APP_CONFIG__={API_BASE_URL:"..."};</script>
```

### 3. Cek request API di DevTools

Tab **Network** → login → request harus ke URL backend (`API_BASE_URL`), **bukan** ke domain frontend.

Contoh benar:

```
POST http://31.97.107.17:3001/api/v1/auth/login
```

Contoh salah (URL kosong → relative path):

```
POST https://seger-web.potydev.cloud/auth/login
```

---

## Troubleshooting

### Request API mengarah ke host frontend sendiri

**Penyebab:** `API_BASE_URL` tidak terbaca saat runtime.

**Solusi:**

1. Pastikan `API_BASE_URL` diset di **Runtime Environment** Dokploy
2. Redeploy container
3. Hard refresh browser (`Ctrl+Shift+R`)
4. Verifikasi `/config.js` dan inline script di `index.html`

### Mixed Content error

**Penyebab:** Frontend HTTPS memanggil API HTTP.

**Solusi:** Gunakan URL API dengan `https://` dan sertifikat valid.

### ERR_CERT_AUTHORITY_INVALID

**Penyebab:** Domain API memakai sertifikat self-signed (Traefik Default Cert).

**Solusi:** Aktifkan Let's Encrypt untuk domain API di Dokploy.

### Perubahan API URL tidak apply

1. Ubah `API_BASE_URL` di Runtime Environment
2. Redeploy (tidak perlu rebuild jika hanya runtime env)
3. Clear cache browser

---

## Scripts npm

| Command | Fungsi |
|---------|--------|
| `npm run dev` | Development server |
| `npm run build` | Build production ke folder `dist/` |
| `npm run preview` | Preview hasil build |
| `npm run lint` | Jalankan ESLint |

---

## Struktur deploy

```text
GitHub (main)
    ↓
Dokploy build (Dockerfile)
    ↓
Container: serve static dist + runtime config
    ↓
Traefik/Dokploy (HTTPS + reverse proxy)
    ↓
User browser
```
