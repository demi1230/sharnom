# Sharnom - Mongolian Yellow Book Directory

Yellowbook-style business directory application built with Nx monorepo, Next.js, Express, and Prisma.

## 🏗️ Architecture

### Monorepo Structure
```
sharnom/
├── apps/
│   ├── sharnom-api/     # Express API + Prisma + SQLite
│   └── sharnom-web/     # Next.js 15 frontend
└── libs/
    ├── contracts/       # Shared Zod schemas & TypeScript types
    └── config/          # Shared configuration
```

### Tech Stack
- **Monorepo**: Nx 21
- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Express, Prisma 6, SQLite
- **Contracts**: Zod schemas for validation & type inference
- **CI/CD**: GitHub Actions

### Key Design Decisions

1. **Shared Contracts Library** (`libs/contracts`)
   - Single source of truth for data models
   - Zod schema provides runtime validation (API) + TypeScript types (Web)
   - Prevents type drift between frontend/backend

2. **Next.js Rendering Strategies**
   - **ISR (Incremental Static Regeneration)**: Homepage (60s revalidation)
   - **SSG (Static Site Generation)**: Detail pages with `generateStaticParams()`
   - **SSR (Server-Side Rendering)**: Search page with `dynamic='force-dynamic'`
   - On-demand revalidation API at `/api/revalidate`

3. **Error Handling**
   - 7-second fetch timeout prevents UI hanging when API is down
   - Graceful fallbacks in all async components
   - Friendly error messages in Mongolian

4. **Performance Optimizations**
   - ISR caching reduces API load
   - SSG pre-renders detail pages at build time
   - Suspense boundaries for progressive loading
   - Documented in `perf.md`

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation
```bash
npm install --legacy-peer-deps
```

### Environment Setup
Create `apps/sharnom-web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
REVALIDATION_SECRET=yellowbook-secret-token-2025
```

### Database Setup
```bash
# Generate Prisma client
npx prisma generate --schema=apps/sharnom-api/prisma/schema.prisma

# Run migrations
npx prisma migrate deploy --schema=apps/sharnom-api/prisma/schema.prisma

# Seed database (7 Mongolian businesses)
npx prisma db seed
```

### Development

**Terminal 1 - Start API:**
```bash
npx nx serve sharnom-api
# Runs on http://localhost:3000
```

**Terminal 2 - Start Web:**
```bash
npx nx dev sharnom-web
# Runs on http://localhost:4200
```

### Testing & Linting
```bash
# Run all tests
npx nx run-many -t test

# Run all linting
npx nx run-many -t lint

# Build all projects
npx nx run-many -t build

# Type check
npx nx run-many -t typecheck
```

## 📁 Project Structure

### API (`apps/sharnom-api`)
- **Endpoints**:
  - `GET /yellow-books` - List all entries (with optional `?search=query`)
  - `GET /yellow-books/:id` - Get single entry
  - `POST /yellow-books` - Create entry (Zod validation)
- **Database**: SQLite with Prisma ORM
- **Seed Data**: 7 realistic Mongolian businesses (Хаан Банк, Номин, etc.)

### Web (`apps/sharnom-web`)
- **Routes**:
  - `/` - Homepage with hero search (ISR, 60s)
  - `/yellow-books/search?q=query` - Search results (SSR)
  - `/yellow-books/[id]` - Business detail page (SSG)
  - `/api/revalidate` - On-demand cache invalidation
- **Features**:
  - Responsive design with TailwindCSS
  - OpenStreetMap integration
  - Skeleton loading states
  - Mongolian UI text

### Contracts (`libs/contracts`)
```typescript
// Zod schema + TypeScript type
export const YellowBookEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  category: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  // ... + optional fields
});

export type YellowBookEntry = z.infer<typeof YellowBookEntrySchema>;
```

## 🎨 UI Design

Based on Mongolian business directory mockups:
- Clean gradient backgrounds (white → orange-50)
- Prominent search bar on homepage
- Circular company logos
- Two-column detail layout (info + map)
- Sticky header with help/feedback buttons
- Footer with contact info

## 🚦 CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):
- ✅ ESLint all projects
- ✅ Run all tests
- ✅ Build all apps
- ✅ TypeScript type check
- ✅ Bypasses Nx Cloud with `--skip-nx-cache`

## 📊 Performance

See `perf.md` for detailed metrics:
- TTFB: <30ms (ISR/SSG)
- LCP: <1200ms
- Bundle size: 104 kB total
- 7 pages pre-rendered at build time

## 🔧 Troubleshooting

**API connection errors:**
- Ensure API is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify database is seeded: `npx prisma db seed`

**Build failures in CI:**
- API must be running for `generateStaticParams()` to pre-render pages
- Or: Pages fall back to on-demand generation if API unavailable

**Prisma errors:**
- Regenerate client: `npx prisma generate --schema=apps/sharnom-api/prisma/schema.prisma`
- Check SQLite file exists: `apps/sharnom-api/prisma/dev.db`

## 📝 License

Private educational project.
