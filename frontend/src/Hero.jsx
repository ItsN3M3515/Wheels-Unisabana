export default function Hero() {
  return (
    <section className="py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight text-neutral-900">
          Pensado para quienes
          <br className="hidden sm:block" />
          se mueven en comunidad.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-neutral-700 max-w-2xl">
          Comodidad y rapidez al alcance de tu celular
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <a
            href="/get-started"
            className="inline-flex items-center rounded-[--radius-pill] bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-[--shadow-soft] hover:opacity-95 focus:outline-none"
          >
            Empieza ahora
          </a>

          <a
            href="/how-it-works"
            className="group inline-flex items-center text-lg text-neutral-900 hover:opacity-80"
          >
            Ver cómo funciona
            <svg
              className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 20 20" fill="currentColor"
            >
              <path d="M7 4l6 6-6 6M12 10H2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
