# Deployment Guide - YouTube Bot Defend Web App

## 🚀 Deploy ke Vercel (Recommended - GRATIS)

### Langkah 1: Persiapan

1. Pastikan sudah punya akun GitHub
2. Push folder `gemini/` ke repository GitHub baru

```bash
# Di folder gemini/
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/youtube-bot-defend-web.git
git push -u origin main
```

### Langkah 2: Deploy ke Vercel

**Opsi A: Via Website (Mudah)**

1. Buka https://vercel.com
2. Sign up/Login dengan GitHub
3. Klik "Add New Project"
4. Import repository GitHub yang baru dibuat
5. Vercel akan auto-detect Vite project
6. Klik "Deploy"
7. Tunggu ~1-2 menit
8. Done! App akan live di `https://your-project.vercel.app`

**Opsi B: Via CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (di folder gemini/)
vercel

# Deploy ke production
vercel --prod
```

### Langkah 3: Custom Domain (Opsional)

1. Beli domain di Niagahoster/Hostinger (~Rp 100rb/tahun)
2. Di Vercel Dashboard → Project → Settings → Domains
3. Add domain: `ytbotdefend.com`
4. Update DNS di registrar:
   - Type: CNAME
   - Name: @
   - Value: cname.vercel-dns.com

## 🔥 Deploy ke Firebase Hosting (Alternatif)

Karena sudah pakai Firebase, bisa juga deploy ke Firebase Hosting:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Init hosting (di folder gemini/)
firebase init hosting

# Pilih:
# - Use existing project: yt-bot-defend
# - Public directory: dist
# - Single-page app: Yes
# - Overwrite index.html: No

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

URL: `https://yt-bot-defend.web.app`

## 📱 URLs Setelah Deploy

| Page | URL |
|------|-----|
| Main App | `https://your-domain.com/` |
| Admin Panel | `https://your-domain.com/admin` |

## ⚠️ Penting: Update OAuth Redirect URI

Setelah deploy, update Google OAuth redirect URI:

1. Buka https://console.cloud.google.com
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client ID
4. Tambahkan Authorized redirect URIs:
   - `https://your-domain.com`
   - `https://your-domain.com/oauth/callback`

## 🔒 Security Checklist

- [ ] Jangan commit file `.env` ke GitHub
- [ ] Update admin password di production
- [ ] Enable Firebase Security Rules
- [ ] Setup rate limiting jika perlu

## 🔄 Auto Deploy

Setelah connect ke GitHub, setiap push ke `main` branch akan auto-deploy ke Vercel.

```bash
# Update dan deploy
git add .
git commit -m "Update feature"
git push origin main
# Vercel akan auto-deploy dalam ~1 menit
```

## 📊 Monitoring

- Vercel Analytics: https://vercel.com/analytics
- Firebase Console: https://console.firebase.google.com

## 💰 Biaya

| Item | Biaya |
|------|-------|
| Vercel Hosting | GRATIS |
| Firebase (Spark Plan) | GRATIS |
| Domain .com | ~Rp 100.000/tahun |
| **Total** | **~Rp 100.000/tahun** |
