import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ModuleViewer from './pages/ModuleViewer';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/module/:id" element={<ModuleViewer />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
