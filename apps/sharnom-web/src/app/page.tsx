import Link from 'next/link';
import { Suspense } from 'react';
import { getYellowBooks } from '../lib/api';
import { YellowBookEntry } from '@sharnom/contracts';

export const revalidate = 60;

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
  } catch (error) {
    console.warn('Failed to fetch yellow books during build:', error);
    // Return empty state when API is unavailable during build
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Yellow books will be available at runtime.</p>
      </div>
    );
  }
}

export default async function Index() {
  return (
    <main className="min-h-screen bg-white">
      <header className="bg-yellow-400 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Yellowbook</h1>
        </div>
      </header>
      <section className="py-8">
        <div className="container mx-auto px-6">
          <Suspense fallback={<YellowBooksListSkeleton />}>
            <YellowBooksList />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
