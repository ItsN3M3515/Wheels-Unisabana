import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight text-neutral-900">
          Pensado para quienes
          <br className="hidden sm:block" />
          se mueven en comunidad.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-neutral-700 max-w-2xl">
          Comodidad y rapidez al alcance de tu celular
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
          >
            Empieza ahora
          </Link>

          <Link
            to="/login"
            className="group inline-flex items-center text-base sm:text-lg text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
          >
            Ya tengo cuenta
            <svg
              className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 4l6 6-6 6"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
