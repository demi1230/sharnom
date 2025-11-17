import Link from 'next/link';
import { Suspense } from 'react';
import { searchYellowBooks } from '../../../lib/api';
import { YellowBookEntry } from '@sharnom/contracts';
import { SearchResultsMap } from '../../../components/SearchResultsMap';

// Force SSR (Server-Side Rendering) - always fetch fresh data
export const dynamic = 'force-dynamic';

// Loading skeleton
function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-300 rounded-3xl w-24 h-24 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Server component for search results
async function SearchResults({ query }: { query: string }) {
  const entries: YellowBookEntry[] = query ? await searchYellowBooks(query) : [];

  if (entries.length === 0 && query) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">&quot;{query}&quot; хайлтын үр дүн олдсонгүй</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Хайх зүйлээ оруулна уу</p>
      </div>
    );
  }

  return (
    <>
      {/* Client-side Interactive Map Island */}
      <SearchResultsMap entries={entries} />

      {/* Server-rendered Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry) => (
          <Link key={entry.id} href={`/yellow-books/${entry.id}`} className="block group">
            <article className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-5">
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-600 rounded-2xl w-32 h-32 flex items-center justify-center mb-4">
                  <span className="text-white text-4xl font-bold">{entry.name.charAt(0)}</span>
                </div>
                <h4 className="font-bold text-xl text-gray-900 mb-2">{entry.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{entry.description || entry.address}</p>
                <span className="text-xs text-gray-500">{entry.category}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </>
  );
}

// Main search page (SSR)
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;

  return (
    <main>
      <section className="py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Хайлтын үр дүн</h2>
          
          {/* Search form */}
          <form method="get" className="mb-8">
            <div className="flex gap-3 max-w-2xl">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Компанийн нэр эсвэл ангилал хайх..."
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 focus:border-yellow-400 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-3 rounded-full transition"
              >
                Хайх
              </button>
            </div>
          </form>

          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults query={q} />
          </Suspense>
        </div>
      </section>

    </main>
  );
}
