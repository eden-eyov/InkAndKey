import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <>
      <Navbar />
      <main className="container hero-section">
        <h1>Join book discussions <br /><span className="accent-text">without spoilers.</span></h1>
        <p>Track your progress and unlock discussions chapter by chapter.</p>
        <div className="hero-btns">
          <button className="btn btn-primary">Get Started</button>
        </div>
      </main>
    </>
  );
};

export default Home;