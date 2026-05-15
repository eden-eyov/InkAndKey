import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="logo">Live<span>Book</span></Link>
        <ul className="nav-links">
          <li><Link to="/dashboard">Browse</Link></li>
        </ul>
        <div className="nav-auth">
          <Link to="/login" className="btn btn-outline">Login</Link>
          <Link to="/register" className="btn btn-primary">Register</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;