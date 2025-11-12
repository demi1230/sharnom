import { Suspense } from 'react';
import Link from 'next/link';
import { getYellowBooks } from '../lib/api';
import { YellowBookEntry } from '@sharnom/contracts';

export const revalidate = 60;

// Skeleton for list
function YellowBooksListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-300 rounded-3xl w-24 h-24 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Streamed company list
async function YellowBooksList() {
  try {
    const entries: YellowBookEntry[] = await getYellowBooks();
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry) => (
          <Link key={entry.id} href={`/yellow-books/${entry.id}`} className="block group">
            <article className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-5">
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-600 rounded-2xl w-32 h-32 flex items-center justify-center mb-4">
                  <span className="text-white text-4xl font-bold">{entry.name.charAt(0)}</span>
                </div>
                <h4 className="font-bold text-xl text-gray-900 mb-2">{entry.name}</h4>
                <p className="text-sm text-gray-600">{entry.description || entry.address}</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    );
  } catch {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Компаниудын мэдээлэл ачаалж чадсангүй.</p>
      </div>
    );
  }
}

export default async function Index() {
  return (
    <main>
      {/* Hero */}
      <section className="relative">
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="mx-auto max-w-4xl text-3xl md:text-[40px] leading-snug font-extrabold tracking-tight text-gray-800 drop-shadow-[0_3px_0_rgba(0,0,0,0.2)]">
            Ямар нэгэн компанийн талаар мэдээлээр байна уу? тэгвэл шууд хай
          </h1>

        
          {/* Search */}
          <form action="/yellow-books/search" method="get" className="mt-10 flex items-center justify-center">
            <div className="relative w-full max-w-2xl">
              <input
                type="text"
                name="q"
                placeholder=""
                className="h-16 w-full rounded-full border-2 border-orange-200 bg-white/90 pl-6 pr-32 text-lg shadow-[0_6px_0_#f1d8b4,0_10px_25px_rgba(0,0,0,0.08)] focus:outline-none focus:border-orange-300"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-14 rounded-full bg-orange-500 px-8 text-white font-bold shadow-md hover:bg-orange-600"
              >
                Хайх
              </button>
            </div>
          </form>

          <p className="mt-12 text-xl font-semibold text-gray-700">Yellowbook танд тусална</p>
        </div>
      </section>

      {/* Streamed Company List - ISR with Suspense */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Бүх компаниуд</h2>
          <Suspense fallback={<YellowBooksListSkeleton />}>
            <YellowBooksList />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
