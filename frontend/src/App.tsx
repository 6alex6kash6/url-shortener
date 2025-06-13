import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dashboard } from './components/Dashboard';
import { RedirectHandler } from './components/RedirectHandler';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/:shortUrl" element={<RedirectHandler />} />
        </Routes>
      </Router>
      <ToastContainer position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App
