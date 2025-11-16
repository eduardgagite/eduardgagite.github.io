import { Header } from './components/header';
import { Footer } from './components/footer';
import { Home } from './pages/home';
import { Materials } from './pages/materials';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-dvh md:h-dvh flex flex-col">
        <Header />
        <main className="flex-1 min-h-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/materials/*" element={<Materials />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}


