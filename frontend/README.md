# VoidVault Frontend

Production React frontend. Live at [voidvault.pages.dev](https://voidvault.pages.dev).

## Stack
- React 19 + TypeScript + Vite
- Cookie-based sessions (`credentials: include`)
- Cloudflare Pages

## Architecture
Browser -> Cloudflare Pages -> Worker API -> Supabase + Cloudinary

Frontend never touches Supabase directly.

## Features
- Username + password signup - no email, no phone, no personal data
- Feed with Trending / Following tabs
- Search users and posts
- Notifications
- Anonymous Advice board
- Direct messaging (Chat)
- User profiles
- Follow / Discover People
- Post composer with media support
- Theme toggle
- Admin panel at `/admin`

## Auth
Username + password only. No email. No OAuth.
**No password reset** - if you lose your password, create a new account.

## Environment
Create `.env` (never commit this):
```env
VITE_API_URL=https://drift-backend.vivekyarra567.workers.dev
```

## Dev
```bash
npm install && npm run dev
```

## Build & Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name voidvault --branch main
```
