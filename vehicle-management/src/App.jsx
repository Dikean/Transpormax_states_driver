import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DailyAlertChecker from './components/DailyAlertChecker';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import Transfers from './pages/Transfers';
import ChatUpload from './pages/ChatUpload';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container mx-auto py-lg">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/upload" element={<ChatUpload />} />
          </Routes>
        </main>
        
        {/* Sistema de alertas diarias */}
        <DailyAlertChecker />
      </div>
    </Router>
  );
}

export default App;
