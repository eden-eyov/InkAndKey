import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // If user is not logged in (guest) - show public default menu
  if (!user) {
    return (
      <header className="px-6 md:px-12 py-6 flex justify-between items-center bg-cream border-b border-stone-200/50">
        <Link to="/" className="font-serif text-2xl italic font-medium text-ink">
          Ink & Key
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-ink hover:opacity-80 transition">
            Sign in
          </Link>
          <Link to="/register" className="px-5 py-2 bg-ink text-white text-sm font-medium rounded-full hover:opacity-90 transition">
            Join
          </Link>
        </div>
      </header>
    );
  }

  // If user is logged in - show authenticated menu
  return (
    <header className="px-6 md:px-12 py-6 flex justify-between items-center bg-cream border-b border-stone-200/50">
      <Link to="/dashboard" className="font-serif text-2xl italic font-medium text-ink">
        Ink & Key
      </Link>
      
      <nav className="flex items-center gap-8">
        <Link 
          to="/dashboard" 
          className={`text-sm font-medium transition ${
            location.pathname === '/dashboard' ? 'text-[#c1a58d]' : 'text-ink hover:opacity-70'
          }`}
        >
          Dashboard
        </Link>
        
        <Link 
          to="/clubs" 
          className={`text-sm font-medium transition ${
            location.pathname.startsWith('/clubs') ? 'text-[#c1a58d]' : 'text-ink hover:opacity-70'
          }`}
        >
          Clubs
        </Link>
        
        <Link 
          to="/profile" 
          className={`text-sm font-medium transition ${
            location.pathname === '/profile' ? 'text-[#c1a58d]' : 'text-ink hover:opacity-70'
          }`}
        >
          Profile
        </Link>
        
        <button 
          onClick={handleLogout}
          className="text-sm font-medium text-ink hover:opacity-70 transition ml-2"
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}

export default Navbar;