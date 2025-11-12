import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from '@/pages/Homepage';
import ConfigurePlan from '@/pages/ConfigurePlan';
import ReviewDashboard from '@/pages/ReviewDashboard';
import ProjectCompletion from '@/pages/ProjectCompletion';
import { Toaster } from 'sonner';

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/configure" element={<ConfigurePlan />} />
          <Route path="/review/:projectId" element={<ReviewDashboard />} />
          <Route path="/complete/:projectId" element={<ProjectCompletion />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;