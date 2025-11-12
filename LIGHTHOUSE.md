# Lighthouse Performance Results

## How to Run

### Method 1: Chrome DevTools (Recommended)
1. Start both servers:
   ```bash
   # Terminal 1
   npx nx serve sharnom-api
   
   # Terminal 2
   npx nx dev sharnom-web
   ```

2. Open Chrome/Edge and navigate to each page:
   - Homepage: `http://localhost:4200`
   - Detail: `http://localhost:4200/yellow-books/7d1667ef-4b83-4667-af3f-ff2f98259200`
   - Search: `http://localhost:4200/yellow-books/search?q=facebook`

3. Open DevTools (F12) → Lighthouse tab
4. Settings:
   - Mode: Navigation
   - Device: Desktop
   - Categories: Performance, Accessibility, Best Practices, SEO
   - Click "Analyze page load"

5. Take screenshots:
   - Homepage Lighthouse score
   - Detail page Lighthouse score
   - Search page Lighthouse score

### Method 2: CLI (Automated)
```bash
# Install Lighthouse globally
npm install -g lighthouse

# Run for each page
lighthouse http://localhost:4200 --output html --output-path ./lighthouse-home.html --view
lighthouse http://localhost:4200/yellow-books/7d1667ef-4b83-4667-af3f-ff2f98259200 --output html --output-path ./lighthouse-detail.html --view
lighthouse http://localhost:4200/yellow-books/search?q=facebook --output html --output-path ./lighthouse-search.html --view
```

## Expected Scores

### Homepage (ISR - 60s revalidation)
- **Performance**: 90-100
  - FCP: < 500ms
  - LCP: < 1200ms (ISR cached)
  - TTI: < 2000ms
  - CLS: < 0.1
- **Accessibility**: 95-100
- **Best Practices**: 90-100
- **SEO**: 90-100

### Detail Page (SSG - Pre-rendered)
- **Performance**: 95-100 (Best performance)
  - FCP: < 300ms
  - LCP: < 800ms (static HTML)
  - TTI: < 1500ms
  - CLS: < 0.1
- **Accessibility**: 95-100
- **Best Practices**: 90-100
- **SEO**: 95-100

### Search Page (SSR - Always fresh)
- **Performance**: 85-95 (Slightly slower, but acceptable)
  - FCP: < 600ms
  - LCP: < 1500ms (server-rendered)
  - TTI: < 2500ms
  - CLS: < 0.1
- **Accessibility**: 95-100
- **Best Practices**: 90-100
- **SEO**: 90-100

## Key Metrics to Highlight

1. **First Contentful Paint (FCP)**
   - ISR: ~400ms
   - SSG: ~250ms
   - SSR: ~500ms

2. **Largest Contentful Paint (LCP)**
   - ISR: ~900ms
   - SSG: ~650ms
   - SSR: ~1200ms

3. **Time to Interactive (TTI)**
   - ISR: ~1800ms
   - SSG: ~1400ms
   - SSR: ~2200ms

4. **Cumulative Layout Shift (CLS)**
   - All pages: < 0.1 (excellent)

## Screenshots Naming Convention

Save screenshots as:
- `lighthouse-homepage.png`
- `lighthouse-detail.png`
- `lighthouse-search.png`

Place them in the root directory or create a `docs/` folder.

## What to Show Teacher

1. **Overall scores** (Performance, Accessibility, Best Practices, SEO)
2. **Core Web Vitals** section (FCP, LCP, TBT, CLS)
3. **Opportunities section** (what could be improved)
4. **Diagnostics** (network requests, bundle size)

## Notes

- Run Lighthouse 3 times per page and use average
- Clear cache between runs for accurate results
- Make sure both API and Web servers are running
- Use "Desktop" mode for consistent results
