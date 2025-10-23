import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SearchTrips from './pages/passenger/SearchTrips';
import MyTrips from './pages/driver/MyTrips';
import MyProfile from './pages/profile/MyProfile';
import RegisterVehicle from './pages/driver/RegisterVehicle';
import BecomeDriver from './pages/driver/BecomeDriver';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from "./Navbar";
import Hero from "./Hero";

function HomePage() {
  const { isAuthenticated, user } = useAuthStore();

  // If authenticated, redirect based on role
  if (isAuthenticated) {
    if (user?.role === 'passenger') {
      return <Navigate to="/search" replace />;
    } else if (user?.role === 'driver') {
      return <Navigate to="/my-trips" replace />;
    }
  }

  return (
    <div className="text-neutral-900">
      <Navbar />
      <Hero />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Passenger routes */}
        <Route 
          path="/search" 
          element={
            <ProtectedRoute requiredRole="passenger">
              <SearchTrips />
            </ProtectedRoute>
          } 
        />

        {/* Driver routes */}
        <Route 
          path="/my-trips" 
          element={
            <ProtectedRoute requiredRole="driver">
              <MyTrips />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/register-vehicle" 
          element={
            <ProtectedRoute requiredRole="driver">
              <RegisterVehicle />
            </ProtectedRoute>
          } 
        />

        {/* Profile route (accessible to both roles) */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          } 
        />

        {/* Become driver route (only for passengers) */}
        <Route 
          path="/become-driver" 
          element={
            <ProtectedRoute requiredRole="passenger">
              <BecomeDriver />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
