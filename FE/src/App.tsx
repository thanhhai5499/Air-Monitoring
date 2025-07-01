// import React from 'react'; // Not needed with new JSX transform
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './AppRouter';

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;
