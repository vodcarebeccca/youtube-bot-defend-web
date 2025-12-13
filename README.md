# 🛡️ YouTube Bot Defend - Web App

Web-based YouTube Live Chat Spam Detector & Moderator.

Deteksi dan hapus spam judol/gambling di live chat YouTube secara otomatis.

![YouTube Bot Defend](https://img.shields.io/badge/YouTube-Bot%20Defend-red?style=for-the-badge&logo=youtube)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase)

## ✨ Features

- 🔍 **Real-time Spam Detection** - 500+ unicode patterns & 300+ keywords
- 🤖 **Pre-authorized Bots** - No login required, use pre-setup bot tokens
- 🛡️ **Auto Moderation** - Auto-delete spam, auto-ban/timeout spammers
- 📊 **Live Dashboard** - Real-time stats (total chat, spam detected, actions)
- 🔊 **Sound Alerts** - Audio notification when spam detected
- ☁️ **Firebase Sync** - Cloud sync for bot tokens & spam patterns
- 👑 **Moderator Check** - Auto-detect if bot is moderator
- ⚙️ **Customizable** - Threshold, whitelist, blacklist

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open http://localhost:3000

## 📖 How to Use

1. Open the web app
2. Paste YouTube Live URL
3. Click "Start Monitoring"
4. Spam will be detected automatically
5. Enable Auto-Delete in Settings for automatic moderation

## ⚠️ Requirements

- Bot must be added as **moderator** on target channel
- Bot needs moderator access for delete/ban actions

## 🔐 Admin Panel

Access admin panel at `/admin` to:
- Manage spam patterns
- Send broadcasts to users
- Configure app settings
- View spam reports

Default password: `admin123`

## 🛠️ Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Firebase Firestore
- YouTube Data API v3

## 📦 Project Structure

```
├── App.tsx              # Main app component
├── admin/               # Admin panel
│   ├── AdminApp.tsx
│   ├── adminService.ts
│   └── tabs/
├── components/          # UI components
├── services/            # API services
│   ├── botService.ts    # Bot token management
│   ├── firebaseService.ts
│   └── spamDetection.ts
└── constants.ts         # Configuration
```

## 🔧 Configuration

Bot tokens and API keys are configured in `constants.ts` or via Firebase Admin Panel.

## 📄 License

MIT License

## 🤝 Contributing

Pull requests are welcome!
