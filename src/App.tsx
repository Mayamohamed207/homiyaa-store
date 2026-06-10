import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import ProductGrid from './components/ProductGrid/ProductGrid';
import ProductPage from './pages/ProductPage/ProductPage';
import Footer from './components/Footer/Footer';
import AdminDashboard from './pages/Admin/AdminDashboard';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <BrowserRouter>
      <div className="app">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '0.9rem',
              borderRadius: '12px',
              padding: '12px 18px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              maxWidth: '360px',
            },
            success: {
              style: {
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
              },
              iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' },
            },
            error: {
              style: {
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
              },
              iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
            },
          }}
        />

        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <ProductGrid searchQuery={searchQuery} />
              </>
            }
          />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;