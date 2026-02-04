# 🚀 SIPAL VOYAGE BOT V1.0

![Sipal-Airdrop](https://img.shields.io/badge/Sipal-Airdrop-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18+-brightgreen?style=for-the-badge)

> **Sipal Airdrop Community Bot** - OnVoyage Daily Check-in Automation

---

## 📑 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Troubleshooting](#-troubleshooting)
- [Disclaimer](#-disclaimer)

---

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🎯 Daily Check-in | Automated daily claim with streak tracking | ✅ |
| 🔄 Auto Retry | Smart retry with exponential backoff | ✅ |
| 🎭 Random User-Agent | Desktop & Mobile UA rotation | ✅ |
| 📋 Stealth Headers | Full browser-like headers | ✅ |
| ⏱️ Random Delay | Human-like timing patterns | ✅ |
| 🔀 Dummy Traffic | Visit other pages before main task | ✅ |
| 🌐 Proxy Support | HTTP/SOCKS proxy support | ✅ |
| 👥 Multi-Account | Unlimited accounts support | ✅ |
| ⏰ Individual Scheduler | Independent account scheduling | ✅ |
| 📊 Dashboard UI | Real-time status table | ✅ |

---

## 📦 Installation

### Prerequisites
- Node.js v18+
- npm

### Steps

```bash
# 1. Clone repository
git clone https://github.com/sipaldrop/VoyageBot-Sipal.git
cd VoyageBot-Sipal

# 2. Install dependencies
npm install

# 3. Setup accounts
copy accounts_tmp.json accounts.json

# 4. Edit accounts.json with your tokens
```

---

## ⚙️ Configuration

### accounts.json Format

```json
[
    {
        "Token_Bearer": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "Proxy": ""
    },
    {
        "Token_Bearer": "ANOTHER_ACCOUNT_TOKEN",
        "Proxy": "http://user:pass@ip:port"
    }
]
```

### How to Get Token

1. Open https://app.onvoyage.ai/dashboard
2. Login with your Google/Wallet
3. Open **Developer Tools** (F12)
4. Go to **Network** tab
5. Find any request to `onvoyage-backend`
6. In **Headers**, find `Authorization: Bearer xxx`
7. Copy the token (starts with `eyJ...`)

### Proxy Formats

```
HTTP:   http://user:pass@ip:port
SOCKS5: socks5://user:pass@ip:port
No Auth: http://ip:port
```

---

## 🚀 Usage

```bash
npm start
```

### Dashboard Preview

```
                   / \
                  /   \
                 |  |  |
                 |  |  |
                  \  \
                 |  |  |
                 |  |  |
                  \   /
                   \ /
    
    ======SIPAL AIRDROP======
  =====SIPAL VOYAGE V1.0=====

┌────────────┬────────────┬──────────┬────────┬────────────┬────────────┬──────────────────────────────┐
│ Account    │ Status     │ Points   │ Streak │ Last Run   │ Next Run   │ Activity                     │
├────────────┼────────────┼──────────┼────────┼────────────┼────────────┼──────────────────────────────┤
│ Account 1  │ SUCCESS    │ 11       │ 2      │ 01:45      │ 5h 15m     │ Already claimed today        │
└────────────┴────────────┴──────────┴────────┴────────────┴────────────┴──────────────────────────────┘

📜 EXECUTION LOGS:
[01:45:00] ℹ️  [SYSTEM]      Loaded 1 account(s)
[01:45:02] ✅ [Account 1]   Logged in as: pubgsec
[01:45:05] ℹ️  [Account 1]   Already checked in today
```

---

## 🔧 Troubleshooting

### Token Expired
- Login to https://app.onvoyage.ai
- Get new token from DevTools
- Update `accounts.json`
- Restart bot

### Rate Limited
Bot auto-retries with exponential backoff.

### Proxy Issues
- Verify proxy format
- Test proxy connection
- Try without proxy

---

## ⚠️ Disclaimer

This bot is for educational purposes only. Using automation for airdrops carries risks:

- Account may be banned
- Points may be reset
- No guarantee of rewards

**Use at your own risk!**

---

## 📜 License

MIT License - See [LICENSE](LICENSE)

---

<p align="center">
  <b>Made with ❤️ by Sipal Airdrop Community</b>
</p>
