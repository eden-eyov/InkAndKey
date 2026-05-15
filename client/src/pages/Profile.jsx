import Navbar from '../components/Navbar';

const Profile = () => {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '3rem 2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: '120px', height: '120px', background: 'var(--secondary)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
          <h2>Jane Doe</h2>
          <p style={{ color: 'var(--text-secondary)' }}>jane.doe@example.com</p>
          <div className="grid-3" style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <div><h3 style={{ color: 'var(--primary)' }}>14</h3><p>Books Read</p></div>
            <div><h3 style={{ color: 'var(--primary)' }}>5</h3><p>Clubs</p></div>
            <div><h3 style={{ color: 'var(--primary)' }}>12</h3><p>Streak</p></div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Profile;