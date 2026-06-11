import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundView() {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate('/')}
      title="Haga clic para volver al inicio"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <img 
        src="/error_404.webp" 
        alt="Error 404 - Página No Encontrada (Haga clic para volver al inicio)" 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}
