// import React from 'react'; // Not needed with new JSX transform
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './AppRouter';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <GoogleOAuthProvider clientId="736254935881-tflb95ek0epa8v6dmoce9tdnlsrqdnbl.apps.googleusercontent.com">
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
        <BrowserRouter>
          <AppRouter />
          <ToastContainer position="top-right" autoClose={1200} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </BrowserRouter>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
