'use client';

import { useState } from 'react';

type SearchResult = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string;
  phone: string;
  website: string | null;
  score: number;
};

type SearchResponse = {
  query: string;
  answer: string;
  results: SearchResult[];
  cached: boolean;
  timestamp: string;
  demoMode?: boolean;
};

export default function AssistantPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3000/api/ai/yellow-books/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Search failed: ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      setResponse(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to search: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="mx-auto max-w-4xl text-3xl md:text-[40px] leading-snug font-extrabold tracking-tight text-gray-800 drop-shadow-[0_3px_0_rgba(0,0,0,0.2)] mb-3">
            🤖 AI Туслах
          </h1>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative w-full max-w-2xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ямар нэгэн компанийн талаар мэдээлээр байна уу? тэгвэл шууд хай"
              disabled={loading}
              className="h-16 w-full rounded-full border-2 border-orange-200 bg-white/90 pl-6 pr-32 text-lg shadow-[0_6px_0_#f1d8b4,0_10px_25px_rgba(0,0,0,0.08)] focus:outline-none focus:border-orange-300 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-1 top-1 h-14 rounded-full bg-orange-500 px-8 text-white font-bold shadow-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Хайж байна...
                </span>
              ) : (
                'Хайх'
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 shadow-sm">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* AI Answer */}
        {response && (
          <div className="space-y-6">
            {/* Demo Mode Warning */}
            {response.demoMode && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-orange-800">Демо горим идэвхтэй</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Энгийн текст хайлт ашиглаж байна. AI хайлт ашиглахын тулд GOOGLE_API_KEY тохируулна уу.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Card */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Хариулт</h2>
                  <p className="text-gray-700 leading-relaxed">{response.answer}</p>
                </div>
                {response.cached && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Кэш хийгдсэн
                  </span>
                )}
              </div>
            </div>

            {/* Results */}
            {response.results.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Тохирох үр дүн ({response.results.length})
                </h3>
                <div className="space-y-4">
                  {response.results.map((result) => (
                    <div
                      key={result.id}
                      className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{result.name}</h4>
                        <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full">
                          {Math.round(result.score * 100)}% таарч байна
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Ангилал:</span> {result.category}
                      </p>
                      {result.description && (
                        <p className="text-sm text-gray-700 mb-2">{result.description}</p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>📍 {result.address}</span>
                        <span>📞 {result.phone}</span>
                      </div>
                      {result.website && (
                        <a
                          href={result.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-orange-500 hover:text-orange-600 hover:underline mt-2 inline-block font-medium"
                        >
                          🌐 Вэбсайт үзэх
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {response.results.length === 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center shadow-sm">
                <p className="text-orange-800">Таны хайлтад тохирох бизнес олдсонгүй.</p>
              </div>
            )}
          </div>
        )}

        {/* Example Queries */}
        {!response && !loading && (
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💡 Жишээ асуултууд:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Банкны зээлийн үйлчилгээ',
                'Супермаркетаас хүнс цуглуулах',
                'Bull рестораны цагийн хуваарь',
                'Илгээмж явуулах',
                'Хамгийн ойрын эмийн сан',
                'Том компаниудын жагсаалт',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-2xl text-gray-700 transition-all border border-orange-100 hover:border-orange-200"
                >
                  &quot;{example}&quot;
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
