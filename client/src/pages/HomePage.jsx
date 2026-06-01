import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen bg-cream font-sans text-ink flex flex-col">
      
      {/* Body*/}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-16 pb-24">
        
        {/* main area */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-[10px] tracking-[0.2em] text-stone-500 font-bold uppercase mb-6 block">
            A spoiler-free reading community
          </span>
          <h1 className="font-serif text-5xl md:text-7xl leading-tight mb-6 text-ink">
            Read together,<br />
            <span className="italic text-[#c1a58d]">without spoilers.</span>
          </h1>
          <p className="text-stone-500 text-sm md:text-base mb-10 max-w-md mx-auto leading-relaxed">
            Join book clubs, track your progress chapter by chapter, and only see discussions about what you've already read.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="px-8 py-3 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition shadow-sm w-full sm:w-auto"
            >
              Start reading
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-3 bg-transparent border border-stone-200 text-ink text-sm font-medium rounded-full hover:border-stone-300 transition w-full sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* footer- features*/}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto w-full border-t border-stone-200/80 pt-16 text-left">
          
          {/*feature 1*/}
          <div className="flex flex-col">
            <span className="text-sm text-[#c1a58d] mb-4 font-serif">01</span>
            <h3 className="font-serif text-2xl mb-3 text-ink">Join a club</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Anyone can start or join a book club. Members vote on what to read next.
            </p>
          </div>

          {/*feature 2*/}
          <div className="flex flex-col">
            <span className="text-sm text-[#c1a58d] mb-4 font-serif">02</span>
            <h3 className="font-serif text-2xl mb-3 text-ink">Track chapters</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Mark chapters as you finish them. Your progress is yours alone.
            </p>
          </div>

          {/*feature 3*/}
          <div className="flex flex-col">
            <span className="text-sm text-[#c1a58d] mb-4 font-serif">03</span>
            <h3 className="font-serif text-2xl mb-3 text-ink">Discuss freely</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Comments unlock chapter-by-chapter. See only what's safe for where you are.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

export default HomePage;