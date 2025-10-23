import './global.css';
import Link from 'next/link';

export const metadata = {
  title: 'Yellowbook',
  description: 'Business directory',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body className="min-h-screen bg-gradient-to-b from-white to-orange-50 text-gray-900">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-orange-100">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="select-none">
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)]">
                Yellowbook
              </span>
            </Link>
            <nav className="flex items-center gap-2 md:gap-3">
              <button aria-label="Help" title="Help" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50">
                ?
              </button>
              <Link
                href="#feedback"
                className="inline-flex items-center rounded-full bg-gray-900 text-white text-sm font-medium px-4 py-2 shadow-md hover:bg-gray-800"
              >
                Санал, хүсэлт
              </Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="mt-24 border-t border-orange-100 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Help</h3>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Contact</h3>
              <p className="text-gray-600">утас: +976/778884433</p>
              <p className="text-gray-600">mail: example@demi.com</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Follow us:</h3>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-900 text-white text-xs">IG</span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-900 text-white text-xs">FB</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
