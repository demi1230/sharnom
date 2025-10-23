export const revalidate = 60;

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
    </main>
  );
}
