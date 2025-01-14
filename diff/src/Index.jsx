import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import PlayerPage from './PlayerPage'; // Importa la nueva página

const Index = () => (
  <Router>
    <Routes>
      <Route path="/diff" element={<App />} />
      <Route path="/diff/player" element={<PlayerPage />} />
    </Routes>
  </Router>
);

export default Index;