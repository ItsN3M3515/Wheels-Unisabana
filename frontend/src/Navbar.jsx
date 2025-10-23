import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* left: logo + brand */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="h-8 w-8 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            W
          </div>
          <span className="font-semibold tracking-tight text-neutral-900">Wheels UniSabana</span>
        </Link>

        {/* right: links */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-flex px-3 py-1.5 text-sm text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
          >
            Regístrate
          </Link>
        </nav>
      </div>
    </header>
  );
}
