import Link from 'next/link';
import { getYellowBooks } from '../lib/api';
import { YellowBookEntry } from '@sharnom/contracts';

export default async function Index() {
  const entries: YellowBookEntry[] = await getYellowBooks();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-yellow-400 shadow-md">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Yellowbook</h1>
          <div className="flex gap-4">
            <button className="text-gray-900 hover:text-gray-700">?</button>
            <button className="text-gray-900 hover:text-gray-700">Санал хүсэлт</button>
          </div>
        </div>
      </header>

      <section className="bg-white py-12 border-b">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ямар нэгэн компанийн талаар мэдээлэл байна уу? Тэгвэл шууд хай
          </h2>
          <button className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium px-8 py-3 rounded-lg transition">
            Хайх
          </button>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Yellowbook танд тусална</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => (
              <Link key={entry.id} href={`/yellow-books/${entry.id}`} className="block">
                <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 h-full border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-500 rounded-lg p-4 flex-shrink-0">
                      <span className="text-white text-2xl font-bold">{entry.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg text-gray-900 mb-1 truncate">{entry.name}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {entry.description || entry.address}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">{entry.category}</span>
                        {entry.rating && <span className="flex items-center gap-1">⭐ {entry.rating.toFixed(1)}</span>}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
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
