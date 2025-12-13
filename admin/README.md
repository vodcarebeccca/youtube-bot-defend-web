# Web App Admin Panel

Admin Panel khusus untuk YouTube Bot Defend Web App.
Terpisah dari Admin Panel Python Tools (`ADMIN/`).

## Akses

- URL: `http://localhost:3000/admin.html`
- Password default: `admin123` atau `ytbotdefend`

## Fitur

### 1. Dashboard
- Statistik total bots, patterns, blacklist, licenses
- Pending spam reports
- Recent activity

### 2. Bot Tokens
- Manage bot tokens untuk web app
- Add/remove bot tokens
- Enable/disable bots

### 3. Spam Patterns
- Manage spam detection patterns
- Add keyword/regex patterns
- Set severity (low/medium/high)

### 4. Global Blacklist
- Manage blacklisted users
- Add/remove users
- Verify blacklist entries

### 5. Broadcasts
- Send announcements ke web app users
- Manage active broadcasts
- Delete old broadcasts

### 6. Spam Reports
- Review user spam reports
- Mark as reviewed/resolved
- Add admin notes

### 7. Licenses
- Manage user licenses
- Add new licenses
- Revoke licenses

### 8. Settings
- Maintenance mode
- Enable/disable features
- App configuration

## Firebase Collections

Web App menggunakan collections terpisah dari Python Tools:

| Web App Collection | Python Tools Collection |
|-------------------|------------------------|
| `webapp_bots` | `bots` |
| `webapp_patterns` | `judol_patterns` |
| `webapp_blacklist` | `global_blacklist` |
| `webapp_broadcasts` | `broadcasts` |
| `webapp_reports` | `spam_reports` |
| `webapp_licenses` | `licenses` |
| `webapp_config` | `remote_config` |

## Development

```bash
cd gemini
npm run dev
# Access admin at http://localhost:3000/admin.html
```

## Build

```bash
npm run build
# Output: dist/admin.html
```
