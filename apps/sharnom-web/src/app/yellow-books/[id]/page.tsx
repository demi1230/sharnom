import { Suspense } from 'react';
import { getYellowBook, getYellowBooks } from '../../../lib/api';
import { YellowBookEntry } from '@sharnom/contracts';

// Generate static paths for all yellow book entries at build time
export async function generateStaticParams() {
  try {
    const entries: YellowBookEntry[] = await getYellowBooks();
    return entries.map((entry) => ({
      id: entry.id,
    }));
  } catch (error) {
    console.warn('Failed to fetch yellow books for generateStaticParams during build:', error);
    // Return empty array if API is not available during build
    // Pages will be generated on-demand instead
    return [];
  }
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
    <main>
      <div className="py-12">
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
                  <div className="bg-blue-600 rounded-full w-52 h-52 flex items-center justify-center mb-6 shadow-2xl ring-4 ring-blue-100">
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

        </div>
      </div>
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
