import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <Routes>
          {/* Main Public Live E-Commerce Store View */}
          <Route
            path="/"
            element={
              <>
                <Hero />
                <ProductGrid searchQuery={searchQuery} />
              </>
            }
          />

          {/* Product Detail Page */}
          <Route path="/product/:id" element={<ProductPage />} />

          {/* Secure Admin Dashboard Panel */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;