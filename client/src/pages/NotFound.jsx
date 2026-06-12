import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <main className="min-h-screen bg-cream font-sans text-ink flex items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          Page not found
        </span>

        <h1 className="font-serif text-8xl md:text-9xl italic mt-4 mb-4">
          404
        </h1>

        <p className="text-stone-500 text-sm md:text-base leading-relaxed mb-8">
          The page you are looking for does not exist, or it may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="px-8 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition shadow-sm w-full sm:w-auto"
          >
            Return home
          </Link>

          <Link
            to="/clubs"
            className="px-8 py-3 bg-white border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-accent hover:text-accent transition w-full sm:w-auto"
          >
            Explore clubs
          </Link>
        </div>
      </div>
    </main>
  );
}

export default NotFound;