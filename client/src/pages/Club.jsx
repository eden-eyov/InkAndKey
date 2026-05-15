import Navbar from '../components/Navbar';

const Club = () => {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '2rem' }}>
        <div className="card" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <img src="https://via.placeholder.com/150x220" alt="Book Cover" />
          <div style={{ flex: 1 }}>
            <span className="badge badge-success">Active Club</span>
            <h1 className="serif">Project Hail Mary</h1>
            <p>1,240 Members • Discussion up to Chapter 12</p>
            <div style={{ marginTop: '1.5rem', background: 'var(--background)', padding: '1rem', borderRadius: '8px' }}>
              <label>Update Progress:</label>
              <input type="range" min="1" max="30" defaultValue="12" style={{ width: '100%', accentColor: 'var(--primary)' }} />
            </div>
          </div>
        </div>

        <h3>Discussions</h3>
        <div className="card" style={{ marginTop: '1rem' }}>
          <span className="badge badge-secondary">Chapter 5</span>
          <h4 style={{ margin: '0.5rem 0' }}>The science in the first few chapters...</h4>
          <p>It's amazing how grounded the physics feel.</p>
        </div>

        <div className="card" style={{ marginTop: '1rem', borderLeft: '4px solid var(--locked)' }}>
          <span className="badge badge-locked">Locked — Reach Chapter 20 to Unlock</span>
          <h4 className="blur-text" style={{ margin: '0.5rem 0' }}>Major plot twist involving Rocky!</h4>
          <p className="blur-text">I can't believe they actually communicated via...</p>
        </div>
      </main>
    </>
  );
};

export default Club;