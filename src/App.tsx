import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { OCR } from './pages/OCR';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/ocr" element={<OCR />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
