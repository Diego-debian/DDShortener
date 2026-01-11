# Frontend Documentation

## Overview

React + Vite + TypeScript frontend for the URL Shortener application. All routes are served under `/app/*` to avoid conflicts with the short URL redirection at `/{short_code}`.

## Tech Stack

- **React** 18+
- **Vite** 5+ (build tool)
- **TypeScript** (type safety)
- **React Router** v6 (routing with basename `/app`)
- **Tailwind CSS** (styling)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Main layout (navbar, footer)
│   ├── pages/
│   │   ├── About.tsx           # /app/about
│   │   ├── Login.tsx           # /app/login
│   │   ├── Register.tsx        # /app/register
│   │   ├── Dashboard.tsx       # /app/dashboard
│   │   ├── Go.tsx              # /app/go/:short_code
│   │   ├── Stats.tsx           # /app/stats/:short_code
│   │   └── Me.tsx              # /app/me
│   ├── App.tsx                 # Router configuration
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind directives
├── public/                     # Static assets
├── Dockerfile                  # Multi-stage build
├── package.json
├── vite.config.ts              # Vite config (base: '/app/')
├── tailwind.config.js
└── tsconfig.json
```

## Development Commands

### Local Development

```bash
cd frontend
npm install
npm run dev
```

The dev server will start on `http://localhost:5173/app/`

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Routes

All routes are under the `/app` base path:

- **`/app/about`** - About page with project information
- **`/app/login`** - Login form (placeholder)
- **`/app/register`** - Registration form (placeholder)
- **`/app/dashboard`** - User dashboard with URL list
- **`/app/go/:short_code`** - Redirect preview for a short code
- **`/app/stats/:short_code`** - Statistics for a short code
- **`/app/me`** - User profile page

## Adding New Routes

1. Create a new page component in `src/pages/`
2. Add the route to `src/App.tsx`
3. Link to it using React Router's `<Link>` component

Example:

```tsx
// src/pages/NewPage.tsx
export default function NewPage() {
  return <h1>New Page</h1>
}

// src/App.tsx
import NewPage from './pages/NewPage'

// In the Routes component:
<Route path="new" element={<NewPage />} />
```

## Styling with Tailwind

Use Tailwind utility classes directly in components:

```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h1 className="text-3xl font-bold text-gray-900">Title</h1>
</div>
```

Refer to [Tailwind CSS documentation](https://tailwindcss.com/docs) for available classes.

## API Integration

API calls should use relative paths to leverage same-origin:

```typescript
// ✅ Good - relative path
const response = await fetch('/api/urls')

// ❌ Bad - hardcoded domain
const response = await fetch('http://localhost:8000/api/urls')
```

All `/api/*` requests are proxied to the backend by nginx.

## Docker Deployment

The frontend is containerized using a multi-stage Dockerfile:

1. **Build stage**: Installs dependencies and builds the app
2. **Runtime stage**: Serves built files via nginx

To build and run:

```bash
# From project root
docker compose build frontend
docker compose up frontend
```

The frontend container runs nginx on port 80 internally. The main proxy service routes `/app/*` requests to this container.

## Environment Variables

Currently no environment variables are needed. API calls use relative paths.

If you need to add environment variables:

1. Create a `.env` file in `frontend/`
2. Prefix variables with `VITE_`
3. Access via `import.meta.env.VITE_VAR_NAME`

## Troubleshooting

### Routes return 404 on refresh

Make sure nginx is configured to proxy `/app/*` to the frontend container. The frontend's internal nginx uses `try_files` to serve `index.html` for all routes (SPA behavior).

### Assets not loading

Verify that `vite.config.ts` has `base: '/app/'` configured.

### CSS not applying

1. Ensure Tailwind directives are in `src/index.css`
2. Verify `tailwind.config.js` content paths include all source files
3. Check that `index.css` is imported in `main.tsx`
