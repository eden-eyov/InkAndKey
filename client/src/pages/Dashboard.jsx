import Navbar from '../components/Navbar';

const Dashboard = () => {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '3rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>My Active Reads</h2>
          <input type="text" placeholder="Search for books..." className="card" style={{ padding: '0.5rem 1rem', width: '300px' }} />
        </div>

        <div className="grid-3">
          {/* Active Book Card */}
          <div className="card">
            <img src="https://via.placeholder.com/150x210" alt="Cover" style={{ width: '100%', borderRadius: '4px' }} />
            <h3 style={{ marginTop: '1rem' }}>Project Hail Mary</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Andy Weir</p>
            <div style={{ background: 'var(--border)', height: '8px', borderRadius: '4px', margin: '15px 0 5px' }}>
              <div style={{ background: 'var(--success)', width: '40%', height: '100%', borderRadius: '4px' }}></div>
            </div>
            <span style={{ fontSize: '0.8rem' }}>Chapter 12 of 30</span>
          </div>

          {/* Skeleton Loading Example */}
          <div className="card" style={{ opacity: 0.5 }}>
            <div style={{ background: '#eee', height: '210px', borderRadius: '4px' }}></div>
            <div style={{ background: '#eee', height: '20px', width: '70%', marginTop: '1rem' }}></div>
            <div style={{ background: '#eee', height: '15px', width: '40%', marginTop: '0.5rem' }}></div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;