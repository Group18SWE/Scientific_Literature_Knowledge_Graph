import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import ResearchGraph from './pages/ResearchGraph';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored !== null ? stored === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <Navbar darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />
        <Routes>
          <Route path="/" element={<Landing darkMode={darkMode} />} />
          <Route path="/graph" element={<ResearchGraph darkMode={darkMode} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
