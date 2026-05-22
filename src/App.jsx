import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CMSProvider } from './context/CMSContext';
import DisplayView from './views/DisplayView';
import AdminPanel from './views/AdminPanel';
import './App.css';

function App() {
  return (
    <CMSProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DisplayView />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </BrowserRouter>
    </CMSProvider>
  );
}

export default App;
