import Link from 'next/link';
import { getYellowBook } from '../../../lib/api';
import { YellowBookEntry } from '@sharnom/contracts';

export default async function YellowBookDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry: YellowBookEntry = await getYellowBook(id);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-yellow-400 shadow-md">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-3xl font-bold text-gray-900 cursor-pointer">Yellowbook</h1>
          </Link>
          <div className="flex gap-4">
            <button className="text-gray-900 hover:text-gray-700">?</button>
            <button className="text-gray-900 hover:text-gray-700">Санал хүсэлт</button>
          </div>
        </div>
      </header>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Буцах
          </Link>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-start gap-6 mb-8">
              <div className="bg-blue-500 rounded-lg p-8 flex-shrink-0">
                <span className="text-white text-5xl font-bold">
                  {entry.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{entry.name}</h1>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-gray-100 px-3 py-1 rounded text-sm">{entry.category}</span>
                  {entry.rating && (
                    <span className="flex items-center gap-1 text-lg">
                      ⭐ {entry.rating.toFixed(1)} / 5.0
                    </span>
                  )}
                </div>
                {entry.description && (
                  <p className="text-gray-600 text-lg">{entry.description}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Компанийн тухай</h2>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-gray-700 min-w-[120px]">Хаяг:</span>
                    <span className="text-gray-600">{entry.address}</span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-gray-700 min-w-[120px]">Утас:</span>
                    <a href={`tel:${entry.phone}`} className="text-blue-600 hover:underline">
                      {entry.phone}
                    </a>
                  </div>
                  
                  {entry.email && (
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Имэйл:</span>
                      <a href={`mailto:${entry.email}`} className="text-blue-600 hover:underline">
                        {entry.email}
                      </a>
                    </div>
                  )}
                  
                  {entry.website && (
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Вэбсайт:</span>
                      <a
                        href={entry.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {entry.website}
                      </a>
                    </div>
                  )}
                  
                  {entry.employees && (
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Ажилтны тоо:</span>
                      <span className="text-gray-600">{entry.employees}</span>
                    </div>
                  )}
                  
                  {entry.founded && (
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Үүсгэн байгуулсан:</span>
                      <span className="text-gray-600">{entry.founded}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Байршил</h2>
                <div className="bg-gray-200 rounded-lg h-64 overflow-hidden">
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
                <p className="text-sm text-gray-500 mt-2">
                  Coordinates: {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div><h3 className="font-bold mb-2">Help</h3></div>
            <div>
              <h3 className="font-bold mb-2">Contact</h3>
              <p className="text-sm text-gray-400">Call: +976-xxxx-xxxx</p>
              <p className="text-sm text-gray-400">Email: support@yellowbook.mn</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Follow us</h3>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white">📘</a>
                <a href="#" className="text-gray-400 hover:text-white">🐦</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
