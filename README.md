# Bill Capture System

A monorepo containing the Bill Capture web app and API server.

## Structure

- `apps/web` - Vite + React + TypeScript frontend
- `apps/server` - Express + Mongoose API server

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- MongoDB Atlas account

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure the server:
```bash
cd apps/server
cp .env.example .env
# Edit .env with your values
```

3. Seed the admin user:
```bash
cd apps/server
ADMIN_PASSWORD=yourpassword pnpm seed:admin
```

4. Start development:
```bash
# In one terminal:
cd apps/server && pnpm dev

# In another terminal:
cd apps/web && pnpm dev
```

The web app runs on http://localhost:5173 and proxies API calls to the server on http://localhost:9100.
