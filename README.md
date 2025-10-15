# Yellowbook - Бизнесийн Лавлах

![Nx](https://img.shields.io/badge/nx-monorepo-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-green)

Nx monorepo, Next.js, Express, болон Prisma ашиглан бүтээсэн орчин үеийн Yellowbook (бизнесийн лавлах) веб аппликейшн.

## 🏗️ Төслийн Бүтэц

Энэхүү workspace нь Nx monorepo-ийн шилдэг практикуудыг дагаж мөрддөг:

```
sharnom/
├── apps/
│   ├── sharnom-api/        # Express API backend
│   ├── sharnom-web/        # Next.js frontend
│   └── sharnom-web-e2e/    # Cypress E2E tests
├── libs/
│   ├── contracts/          # Shared schemas (Zod)
│   └── config/             # Shared configuration
```

## 🎯 Боломжууд

- ✅ **Nx Monorepo**: Сайн зохион байгуулалттай apps болон libs
- ✅ **Төрлийн аюулгүйContract**: API болон Web-д хамтран ашигладаг Zod schema
- ✅ **Prisma ORM**: Migration бүхий SQLite өгөгдлийн сан
- ✅ **Seed өгөгдөл**: 7 компанийн мэдээлэл
- ✅ **REST API**: Баталгаажуулалт бүхий Express endpoints
- ✅ **Next.js 15**: App Router бүхий орчин үеийн React
- ✅ **Responsive UI**: Tailwind CSS загвар
- ✅ **CORS болон Security Headers**: бэлэн API

## 🚀 Quick start
 
### Шаардлагатай зүйлс

- Node.js 20+ болон npm
- Git

### Суулгалт

```bash
# Repository-г clone хийх
git clone <your-repo-url>
cd sharnom

# Dependencies суулгах
npm install

# Өгөгдлийн сан болон seed өгөгдөл тохируулах
cd apps/sharnom-api
npx prisma migrate dev
npx tsx prisma/seed.ts
cd ../..
```

### Хөгжүүлэлт

API болон Web-ийг зэрэг ажиллуулах:

```bash
# Terminal 1: Start API (port 3000)
npx nx serve sharnom-api

# Terminal 2: Start Web (port 4200)
npx nx serve sharnom-web
```

**Өөр арга (хэрэв Nx удаан бол):**

```bash
# Terminal 1: API-г шууд ажиллуулах
npm run dev:api:direct
# эсвэл: cd apps/sharnom-api && npx tsx src/main.ts

# Terminal 2: Web-ийг шууд ажиллуулах
npm run dev:web:direct
# эсвэл: cd apps/sharnom-web && npx next dev -p 4200
```

Дараа нь browser дээрээ http://localhost:4200 хаягийг нээнэ.

## 📋 API Endpoints

- `GET /yellow-books` - Бүх бизнесийн жагсаалт
- `GET /yellow-books/:id` - Бизнесийн дэлгэрэнгүй мэдээлэл


## 🎨 Дизайны Сонголтууд

### Архитектур

1. **Nx-тэй Monorepo**: Аппликейшнүүдийн хооронд код хуваалцах болон нэгдсэн хэрэгслүүд ашиглах боломжтой
2. **Contract эхэндээ**: `libs/contracts` дахь Zod schema нь frontend болон backend хооронд төрлийн аюулгүй байдлыг баталгаажуулна
3. **SQLite**: Энгийн, файл дээр суурилсан өгөгдлийн сан, хөгжүүлэлт болон демо зориулалтад тохиромжтой

### Schema Дизайн

`YellowBookEntrySchema` дараахыг агуулна:
- Үндсэн мэдээлэл: нэр, тайлбар, хаяг, утас
- Холбоо барих: имэйл, вэбсайт
- Байршил: өргөрөг, уртраг (газрын зураг холбоход)
- Мета өгөгдөл: ангилал, үнэлгээ, ажилчдын тоо, байгуулагдсан он
- Цагийн тэмдэг: үүсгэсэн огноо, шинэчилсэн огноо

### API Дизайн

- RESTful endpoints
- POST хүсэлт дээр Zod баталгаажуулалт (буруу өгөгдөл дээр 400 алдаа)
- Локал хөгжүүлэлтэд CORS идэвхжүүлсэн
- Аюулгүй байдлын headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)

### Frontend Дизайн

- Оновчтой ажиллагааны тулд Server Components
- Responsive grid layout (дэлгэцийн хэмжээнээс хамааран 1/2/3 багана)
- Хүртээмжтэй markup (semantic HTML, alt текстүүд, ARIA landmarks)
- Газрын зураг бүхий дэлгэрэнгүй хуудас (Leaflet/Google Maps холбоход бэлэн)

## 🧪 Тестлэх болон Linting

```bash
# Linter ажиллуулах
npx nx lint sharnom-api
npx nx lint sharnom-web

# Төрөл шалгах
npx nx run sharnom-api:tsc
npx nx run sharnom-web:tsc

# Тестүүд ажиллуулах
npx nx test sharnom-api
npx nx test sharnom-web

# E2E тестүүд
npx nx e2e sharnom-web-e2e
```

## 🔄 CI/CD

Nx affected командуудтай CI-д тохируулагдсан:

```bash
# Зөвхөн өөрчлөгдсөн төслүүдийг build хийх
npx nx affected --target=build

# Зөвхөн өөрчлөгдсөн төслүүдийг тестлэх
npx nx affected --target=test

# Зөвхөн өөрчлөгдсөн төслүүдийг lint хийх
npx nx affected --target=lint
```

## 📦 Build

```bash
# API build хийх
npx nx build sharnom-api

# Web build хийх
npx nx build sharnom-web
```

## 🛠️ Технологиуд

- **Nx 21**: Monorepo хэрэгсэл
- **Next.js 15**: App Router бүхий React framework
- **Express 4**: Node.js web framework
- **Prisma 6**: Орчин үеийн ORM
- **Zod 4**: Schema баталгаажуулалт
- **TypeScript 5**: Төрлийн аюулгүй байдал
- **Tailwind CSS 3**: Utility-first CSS
- **ESLint & Prettier**: Кодын чанар

## 📝 Тэмдэглэл

- Өгөгдлийн сангийн файл `apps/sharnom-api/prisma/dev.db` хаягт хадгалагдана
- Seed өгөгдөл нь Улаанбаатарын координаттай 7 Монголын компанийг агуулна
- Газрын зургийн интеграци нь placeholder - Leaflet эсвэл Google Maps-аар солих боломжтой
- Бүх текстүүд Монгол үсэг (Кирилл)-г дэмждэг

## 👨‍💻 Зохиогч

Вэб Хөгжүүлэлтийн хичээлийн лабораторийн даалгаврын нэг хэсэг болгон бүтээгдсэн.

## 📄 Лиценз

MIT


```sh
npx nx g @nx/react:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)


[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/next?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
