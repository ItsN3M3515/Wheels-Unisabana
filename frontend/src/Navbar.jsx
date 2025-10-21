export default function Navbar() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto max-w-6xl h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* left: logo + brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-brand-600 grid place-items-center text-white font-bold">
            W
          </div>
          <span className="font-semibold tracking-tight">Wheels UniSabana</span>
        </div>

        {/* right: links */}
        <nav className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden sm:inline text-sm hover:underline"
          >
            Iniciar sesión
          </a>
          <a
            href="/register"
            className="inline-flex items-center rounded-[--radius-pill] bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-[--shadow-soft] hover:opacity-95 focus:outline-none"
          >
            Regístrate
          </a>
        </nav>
      </div>
    </header>
  );
}
