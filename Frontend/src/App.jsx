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
    document.documentElement.style.background = darkMode ? '#050a14' : '#f8fafc';
  }, [darkMode]);

  return (
    <BrowserRouter>
      <div
        className="flex flex-col min-h-screen"
        style={{ background: darkMode ? '#050a14' : '#f8fafc' }}
      >
        <Navbar darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />
        <Routes>
          <Route path="/" element={<Landing darkMode={darkMode} />} />
          <Route path="/graph" element={<ResearchGraph darkMode={darkMode} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
