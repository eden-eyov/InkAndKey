import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Register = () => {
  const genres = ['Fantasy', 'Mystery', 'Romance', 'Sci-Fi', 'Biography', 'History'];

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '500px', padding: '4rem 2rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem' }}>Create Account</h2>
          <form>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" />
            </div>
            
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Favorite Genres</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '10px 0 20px' }}>
              {genres.map(genre => (
                <button key={genre} type="button" className="badge badge-secondary" style={{ border: 'none', cursor: 'pointer' }}>
                  {genre}
                </button>
              ))}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
          </form>
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;