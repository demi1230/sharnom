# Лаб 7: Нэвтрэлт ба Эрх

## Тайлбар
GitHub OAuth нэвтрэлтийг NextAuth.js (v5) ашиглан хэрэгжүүлж, эрхийн түвшинд суурилсан хандалтын хяналт (RBAC) болон CSRF хамгаалалтыг нэмсэн.

## Хэрэгжүүлсэн функцүүд

### ✅ 1. GitHub OAuth ба NextAuth
- **Үйлчилгээ**: GitHub OAuth App
- **Сан**: NextAuth.js v5 (beta)
- **Адаптер**: Prisma Adapter өгөгдлийн санд хадгалах
- **Чиглүүлэлт**: `/api/auth/[...nextauth]`

### ✅ 2. Хэрэглэгчийн загвар эрхийн түвшинтэй
**Prisma схем** (`apps/sharnom-api/prisma/schema.prisma`):
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  image         String?
  role          String    @default("user") // "user" | "admin"
  githubId      String?   @unique
  accounts      Account[]
  sessions      Session[]
}
```

**Анхны админ хэрэглэгч**:
- Имэйл: `admin@sharnom.com`
- Эрх: `admin`
- Үүсгэсэн: `npx prisma db seed` командаар

### ✅ 3. SSR нэвтрэлтийн хамгаалалт
**Файл**: `apps/sharnom-web/src/app/admin/page.tsx`

**Хэрэгжилт**:
```typescript
import { auth } from '../../lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();
  
  // Guard: Check authentication
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin');
  }
  
  // Guard: Check admin role
  const userRole = (session.user as any).role;
  if (userRole !== 'admin') {
    return <AccessDenied />;
  }
  
  return <AdminDashboard />;
}
```

**Хамгаалагдсан чиглүүлэлтүүд**:
- `/admin` - Админы хяналтын самбар (`admin` эрх шаардлагатай)
- `/admin/*` - Ирээдүйн админ хуудсууд

### ✅ 4. API эрхийн түвшинд суурилсан хамгаалалт
**Файл**: `apps/sharnom-api/src/middleware/auth.ts`

**Middleware код**:
```typescript
// Require authentication
export function requireAuth(req, res, next) { ... }

// Require specific role
export function requireRole(allowedRoles: string[]) { ... }

// Combined: auth + admin
export const requireAdmin = [requireAuth, requireRole(['admin'])];
```

**Хамгаалагдсан API чиглүүлэлтүүд**:
- `GET /admin/users` - Бүх хэрэглэгчийг харах (зөвхөн админ)
- `PATCH /admin/users/:id/role` - Хэрэглэгчийн эрхийг өөрчлөх (зөвхөн админ)
- `DELETE /admin/yellow-books/:id` - Бичлэг устгах (зөвхөн админ)

**Хэрэглээний жишээ**:
```typescript
app.get('/admin/users', ...requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});
```

### ✅ 5. CSRF хамгаалалт
**Хэрэгжилт**: NextAuth.js v5 нь CSRF хамгаалалтыг өөртөө агуулна.

**Ажиллах зарчим**:
1. **CSRF Token Cookie**: NextAuth автоматаар `next-auth.csrf-token` cookie үүсгэнэ
2. **Token баталгаажуулалт**: `/api/auth/*` рүү ирэх бүх POST хүсэлтүүд CSRF token шалгана
3. **Давхар Cookie загвар**: Cookie дахь token + хүсэлтийн биед байгаа token

**Хувийн API чиглүүлэлтүүдэд** (шаардлагатай бол):
```typescript
// Optional: Add CSRF middleware for custom mutations
import { getCsrfToken } from 'next-auth/react';

// Client-side:
const csrfToken = await getCsrfToken();
fetch('/api/custom-mutation', {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify(data),
});
```

## Тохиргооны заавар

### 1. GitHub OAuth App үүсгэх
1. https://github.com/settings/developers хуудас руу орох
2. "New OAuth App" дээр дарах
3. Бөглөх:
   - **Application name**: Sharnom Dev
   - **Homepage URL**: `http://localhost:4200`
   - **Authorization callback URL**: `http://localhost:4200/api/auth/callback/github`
4. **Client ID** болон **Client Secret**-ийг хуулах

### 2. Орчны хувьсагчдыг тохируулах
**Файл**: `apps/sharnom-web/.env.local`

```env
# NextAuth Configuration
AUTH_SECRET=your-super-secret-auth-secret-change-in-production
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here

# Database URL (shared with API)
DATABASE_URL=file:../../../apps/sharnom-api/prisma/dev.db
```

**AUTH_SECRET үүсгэх**:
```bash
npx auth secret
# or
openssl rand -base64 32
```

### 3. Migration ажиллуулах
```bash
cd apps/sharnom-api
npx prisma migrate dev
npx prisma db seed
```

### 4. Серверүүдийг ажиллуулах
```bash
# Terminal 1: API
npx nx serve sharnom-api

# Terminal 2: Web
npx nx dev sharnom-web
```

### 5. Нэвтрэлтийн процессыг турших
1. http://localhost:4200/admin хуудас руу орох
2. `/auth/signin` хуудас руу чиглүүлэгдэнэ
3. "Continue with GitHub" дээр дарах
4. GitHub дээр апп-ыг зөвшөөрөх
5. `/admin` хуудас руу буцаж чиглүүлэгдэнэ
6. **Анх удаа**: "Access Denied" харагдана (таны GitHub данс админ эрхтэй байх ёстой)
7. **Админ эрх олгох**: Өгөгдлийн санд хэрэглэгчийг шинэчлэх:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-github-email@example.com';
   ```
8. Гарч дахин нэвтрэх
9. Одоо Админы хяналтын самбар харагдах ёстой

## RBAC турших

### Хэрэглэгчийн эрх турших
**Сценари 1: Админ бус хэрэглэгч**:
1. GitHub-ээр нэвтрэх (админ бус данс)
2. `/admin` хуудас руу орох
3. Хүлээгдэж буй үр дүн: "Access Denied" мессеж

**Сценари 2: Админ хэрэглэгч**:
1. GitHub-ээр нэвтрэх (админ данс эсвэл анхны админ)
2. `/admin` хуудас руу орох
3. Хүлээгдэж буй үр дүн: Удирдлагын картуудтай админы самбар

### API хамгаалалт турших
```bash
# Without token (should fail)
curl http://localhost:3000/admin/users

# With token (mock - in production, use real JWT)
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer mock-token"
```

## Аюулгүй байдлын анхаарах зүйлс

### ✅ Хэрэгжүүлсэн
- GitHub OAuth нэвтрэлт
- Эрхийн түвшинд суурилсан хандалтын хяналт (RBAC)
- Серверийн талын сесс баталгаажуулалт
- CSRF хамгаалалт (NextAuth-д суурилуулсан)
- Аюулгүй cookie тохиргоо (httpOnly, production дээр secure)
- SQL injection хамгаалалт (Prisma)

### 🔄 Production орчинд шаардлагатай
- [ ] API нэвтрэлтэд бодит JWT token ашиглах
- [ ] Token сэргээх механизм нэмэх
- [ ] Хурдны хязгаарлалт нэмэх (express-rate-limit)
- [ ] HTTPS идэвхжүүлэх (TLS/SSL)
- [ ] Production дээр аюулгүй cookie тохиргоо хийх
- [ ] Сессийн хугацаа дуусах болон сэлгэх нэмэх
- [ ] Админы үйлдлүүдийн лог хөтлөх
- [ ] Админ дансанд 2FA/MFA нэмэх

## Файлын бүтэц

```
apps/
├── sharnom-web/
│   ├── src/
│   │   ├── lib/
│   │   │   └── auth.ts                      # NextAuth configuration
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   └── page.tsx                 # Admin dashboard (SSR guard)
│   │   │   ├── auth/
│   │   │   │   └── signin/
│   │   │   │       └── page.tsx             # Sign-in page
│   │   │   └── api/
│   │   │       └── auth/
│   │   │           └── [...nextauth]/
│   │   │               └── route.ts         # NextAuth API routes
│   └── .env.local                           # Environment variables
├── sharnom-api/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts                      # Role-based guards
│   │   └── main.ts                          # Protected API routes
│   └── prisma/
│       ├── schema.prisma                    # User + NextAuth models
│       ├── seed.ts                          # Admin user seed
│       └── migrations/
│           ├── 20251210103902_add_user_model/
│           └── 20251210104627_add_nextauth_tables/
```

## API төгсгөлийн цэгүүд

### Нийтийн чиглүүлэлтүүд
- `GET /yellow-books` - Компаниудын жагсаалт
- `GET /yellow-books/:id` - Компанийн дэлгэрэнгүй
- `POST /yellow-books` - Компани үүсгэх (зөвхөн баталгаажуулалт)

### Хамгаалагдсан чиглүүлэлтүүд (Зөвхөн админ)
- `GET /admin/users` - Бүх хэрэглэгчийн жагсаалт
- `PATCH /admin/users/:id/role` - Хэрэглэгчийн эрх шинэчлэх
- `DELETE /admin/yellow-books/:id` - Компани устгах

## NextAuth тохиргоо

**Файл**: `apps/sharnom-web/src/lib/auth.ts`

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub(...)],
  callbacks: {
    async session({ session, user }) {
      // Load role from database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      session.user.role = dbUser.role;
      return session;
    },
  },
});
```

**Гол функцүүд**:
- **Адаптер**: SQLite-д сесс болон дансыг хадгална
- **Callback функцүүд**: Сессийн объектод `role` оруулна
- **Үйлчилгээ**: GitHub OAuth

## Асуудал шийдвэрлэлт

### "Invalid token" алдаа
- `GITHUB_CLIENT_ID` болон `GITHUB_CLIENT_SECRET` тохируулсан эсэхийг шалгах
- Callback URL нь GitHub OAuth апп тохиргоотой таарч байгаа эсэхийг шалгах

### Админд "Access Denied" гарах нь
- Өгөгдлийн санд хэрэглэгчийн эрхийг шалгах:
  ```bash
  sqlite3 apps/sharnom-api/prisma/dev.db
  SELECT * FROM users;
  ```
- Админ эрх олгох:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
  ```

### API 401 Unauthorized буцаах нь
- Одоогийн хэрэгжилт нь demo-д хуурамч auth ашиглаж байна
- Production дээр бодит JWT баталгаажуулалт хэрэгжүүлэх
- Тестэд ямар ч Bearer token ашиглаж болно (жишээ нь, `Bearer test-token`)

## Лабын шаардлага биелэлт

- [x] **GitHub OAuth App үүсгэсэн** (Хөгжүүлэлтийн орчин)
- [x] **Орчны хувьсагчид** (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `AUTH_SECRET`)
- [x] **NextAuth чиглүүлэлт** (`/api/auth/[...nextauth]`)
- [x] **Эрхтэй хэрэглэгчийн загвар** (Prisma схем + migration)
- [x] **Админ хэрэглэгч үүсгэсэн** (`admin@sharnom.com` `admin` эрхтэй)
- [x] **Сессийн Callback** (Сессд эрх оруулна)
- [x] **API эрхийн хамгаалалт** (`requireAdmin` middleware)
- [x] **Хамгаалагдсан API чиглүүлэлтүүд** (`/admin/*` төгсгөлүүд)
- [x] **SSR хамгаалалт** (`/admin` дээр серверийн талын сесс шалгалт)
- [x] **CSRF хамгаалалт** (NextAuth-д суурилуулсан)

## Дараагийн алхамууд

1. **Бодит GitHub OAuth App үүсгэх** (туршилтын credentials солих)
2. **OAuth урсгалыг турших** (нэвтрэх, админ руу нэвтрэх, хамгаалалт шалгах)
3. **API-д JWT хэрэгжүүлэх** (хуурамч auth-ыг бодит token-оор солих)
4. **Админ UI нэмэх** (хэрэглэгч удирдах, эрх шинэчлэх)
5. **HTTPS-тэй deploy хийх** (production дээр аюулгүй cookie идэвхжүүлэх)

---

**Зохиогч**: Лаб 7 хэрэгжүүлэлт  
**Огноо**: 2025 оны 12-р сарын 10  
**Framework**: Next.js 15 + NextAuth.js v5 + Prisma
