import Link from 'next/link';
import { Suspense } from 'react';
import { getYellowBook, getYellowBooks } from '../../../lib/api';
import { YellowBookEntry } from '@sharnom/contracts';

// Generate static paths for all yellow book entries at build time
export async function generateStaticParams() {
  const entries: YellowBookEntry[] = await getYellowBooks();
  return entries.map((entry) => ({
    id: entry.id,
  }));
}

// Loading component for detail page
function YellowBookDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 animate-pulse">
        <div className="p-10 bg-gradient-to-br from-gray-50 to-white">
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
        <div className="p-10">
          <div className="bg-gray-200 rounded-3xl w-48 h-48 mx-auto mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}

// Detail content component
async function YellowBookDetailContent({ id }: { id: string }) {
  const entry: YellowBookEntry = await getYellowBook(id);

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-yellow-400 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-gray-700">Yellowbook</h1>
          </Link>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder=""
              className="px-4 py-2 rounded-full border-2 border-gray-200 focus:border-yellow-500 focus:outline-none w-64"
            />
            <button className="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          <div className="flex gap-6 items-center">
            <button className="text-gray-900 hover:text-gray-700 text-xl">?</button>
            <button className="text-gray-900 hover:text-gray-700 font-medium">Санал, хүсэлт</button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-b from-yellow-50 to-white py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Column - Company Info */}
              <div className="p-10 bg-gradient-to-br from-gray-50 to-white">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">{entry.name}</h1>
                
                {entry.description && (
                  <p className="text-gray-700 mb-8 leading-relaxed">{entry.description}</p>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Компанийн тухай</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="font-semibold text-gray-700 min-w-[140px]">Хаяг:</span>
                        <span className="text-gray-600">{entry.address}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="font-semibold text-gray-700 min-w-[140px]">Утас:</span>
                        <span className="text-gray-600">{entry.phone}</span>
                      </div>
                      {entry.email && (
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-gray-700 min-w-[140px]">И-мэйл:</span>
                          <span className="text-gray-600">{entry.email}</span>
                        </div>
                      )}
                      {entry.website && (
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-gray-700 min-w-[140px]">Вэбсайт:</span>
                          <a href={entry.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {entry.website}
                          </a>
                        </div>
                      )}
                      {entry.founded && (
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-gray-700 min-w-[140px]">Үүсгэн байгуулсан:</span>
                          <span className="text-gray-600">{entry.founded}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(entry.employees || entry.rating) && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Үйл ажиллагаа</h3>
                      <div className="space-y-4">
                        {entry.employees && (
                          <div className="flex items-start gap-3">
                            <span className="font-semibold text-gray-700 min-w-[140px]">Ажилчдын тоо:</span>
                            <span className="text-gray-600">{entry.employees}</span>
                          </div>
                        )}
                        {entry.rating && (
                          <div className="flex items-start gap-3">
                            <span className="font-semibold text-gray-700 min-w-[140px]">Үнэлгээ:</span>
                            <span className="text-yellow-500 font-semibold">⭐ {entry.rating.toFixed(1)}/5.0</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Logo and Map */}
              <div className="p-10 flex flex-col justify-between bg-white">
                <div className="flex flex-col items-center mb-8">
                  <div className="bg-blue-600 rounded-3xl w-48 h-48 flex items-center justify-center mb-6 shadow-2xl">
                    {entry.name === 'Facebook' ? (
                      <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    ) : (
                      <span className="text-white text-6xl font-bold">{entry.name.charAt(0)}</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 text-center">{entry.name}</h2>
                  {entry.category && (
                    <span className="mt-2 px-4 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                      {entry.category}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Байршил</h3>
                  <div className="bg-gray-200 rounded-2xl h-64 overflow-hidden shadow-inner">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${entry.longitude - 0.01},${entry.latitude - 0.01},${entry.longitude + 0.01},${entry.latitude + 0.01}&layer=mapnik&marker=${entry.latitude},${entry.longitude}`}
                      allowFullScreen
                      title={`Map showing location of ${entry.name}`}
                    ></iframe>
                  </div>
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    📍 {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Буцах
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div><h3 className="font-bold mb-2">Help</h3></div>
            <div>
              <h3 className="font-bold mb-2">Contact</h3>
              <p className="text-sm text-gray-400">утас: +976/77884433</p>
              <p className="text-sm text-gray-400">mail: example@teach.com</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Follow us:</h3>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Main detail page with Suspense
export default async function YellowBookDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<YellowBookDetailSkeleton />}>
      <YellowBookDetailContent id={id} />
    </Suspense>
  );
}
