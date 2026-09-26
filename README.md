# VoidVault

**Privacy-first social networking without requiring your real-world identity.**

VoidVault is a production-deployed full-stack social platform built around a simple idea: you should not have to hand over an email address, phone number, or third-party identity just to have a voice online.

## Repository structure

```text
voidvault/
├── frontend/   React 19 + TypeScript + Vite
└── backend/    Cloudflare Workers + TypeScript + Supabase PostgreSQL
```

This repository combines the code from the original standalone repositories while leaving them intact:

- Frontend source: https://github.com/vivekyarra/voidvault-frontend
- Backend source: https://github.com/vivekyarra/voidvault-backend

## Live product

https://voidvault.pages.dev

## Product

VoidVault supports:

- Username + password accounts — no email, phone number, or OAuth required
- Feed with Trending and Following views
- Posts with media
- Search
- Profiles and follows
- Notifications
- Direct messaging
- Anonymous Advice board
- Moderation and reporting
- Admin console
- Theme support

## Architecture

```text
Browser
  ↓
Cloudflare Pages
  ↓
Cloudflare Workers API
  ↓
Supabase PostgreSQL + Cloudinary
```

The browser does not access Supabase directly.

## Security model

The backend includes:

- DB-backed sessions with hashed session tokens
- HTTP-only cookies
- bcrypt password hashing
- CSRF validation on mutations
- Strict single-origin CORS
- Per-IP rate limiting
- CSP, HSTS, X-Frame-Options and Referrer-Policy headers
- Input sanitization and body-size limits
- Moderation/reporting controls

## Run locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

See the README inside each directory for environment configuration and deployment details.

---

Built by [Yarra Vivek](https://github.com/vivekyarra).
