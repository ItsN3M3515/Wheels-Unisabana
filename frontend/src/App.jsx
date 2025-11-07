import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import SearchTrips from './pages/passenger/SearchTrips';
import PassengerMyTrips from './pages/passenger/MyTrips';
import DriverMyTrips from './pages/driver/MyTrips';
import MyProfile from './pages/profile/MyProfile';
import RegisterVehicle from './pages/driver/RegisterVehicle';
import BecomeDriver from './pages/driver/BecomeDriver';
import MyVehicle from './pages/driver/MyVehicle';
import CreateTripOffer from './pages/driver/CreateTripOffer';
import TripDetails from './pages/driver/TripDetails';
import BookingRequests from './pages/driver/BookingRequests';
import CreateReview from './pages/reviews/CreateReview';
import DriverVerificationPage from './pages/driver/DriverVerification';
import AdminDashboardPage from './pages/admin/AdminDashboard';
import AdminAuditPage from './pages/admin/AdminAudit';
import Reports from './pages/Reports';
import DriverProfile from './pages/DriverProfile';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from "./Navbar";
import Hero from "./Hero";

function HomePage() {
  const { isAuthenticated } = useAuthStore();

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="text-neutral-900">
      <Navbar />
      <Hero />
    </div>
  );
}

function MyTripsRouter() {
  const { user } = useAuthStore();
  
  // Render appropriate component based on role
  if (user?.role === 'driver') {
    return <DriverMyTrips />;
  } else {
    return <PassengerMyTrips />;
  }
}

export default function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard - main page after login (both roles) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

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
        {/* Note: /my-trips is used by both roles with different components */}
        <Route 
          path="/my-trips" 
          element={
            <ProtectedRoute>
              {/* This will render different components based on role */}
              <MyTripsRouter />
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
        <Route 
          path="/driver/my-vehicle" 
          element={
            <ProtectedRoute requiredRole="driver">
              <MyVehicle />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/create-trip" 
          element={
            <ProtectedRoute requiredRole="driver">
              <CreateTripOffer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/trips/:id" 
          element={
            <ProtectedRoute requiredRole="driver">
              <TripDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/booking-requests" 
          element={
            <ProtectedRoute requiredRole="driver">
              <BookingRequests />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/verification"
          element={
            <ProtectedRoute requiredRole="driver">
              <DriverVerificationPage />
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

        {/* Review routes */}
        <Route 
          path="/trips/:tripId/review" 
          element={
            <ProtectedRoute requiredRole="passenger">
              <CreateReview />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminAuditPage />
            </ProtectedRoute>
          }
        />

        {/* Reports route (accessible to both roles) */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } 
        />

        {/* Driver Profile route (public, shows reviews) */}
        <Route 
          path="/drivers/:driverId" 
          element={
            <ProtectedRoute>
              <DriverProfile />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
