import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* The 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Global Footer */}
      <footer className="footer">
        <p>&copy; 2026 LiveBook. Keep reading, keep sharing.</p>
      </footer>
    </Router>
  );
}

export default App;