import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CMSProvider } from './context/CMSContext';
import DisplayView from './views/DisplayView';
import NotFoundView from './views/NotFoundView';
import './App.css';

const AdminPanel = lazy(() => import('./views/AdminPanel'));

function App() {
  return (
    <CMSProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DisplayView />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<div style={{ background: '#0a0a0a', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Cargando Panel...</div>}>
                <AdminPanel />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </BrowserRouter>
    </CMSProvider>
  );
}

export default App;
