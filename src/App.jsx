import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import CarritoDashboard from './pages/CarritoDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import ClientMenu from './pages/ClientMenu';
import Layout from './components/Layout';
import { useStore } from './context/StoreContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useStore();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />; // O a una página de "No autorizado"
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route (Login) */}
        <Route path="/" element={<Login />} />
        
        {/* Public Route for Clients (No login needed) - Updated URL Structure */}
        <Route path="/menu/:restaurantId/:tableId" element={<ClientMenu />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/carrito" element={
            <ProtectedRoute allowedRoles={['carrito']}>
              <CarritoDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/restaurant" element={
            <ProtectedRoute allowedRoles={['restaurant']}>
              <RestaurantDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/waiter" element={
            <ProtectedRoute allowedRoles={['waiter']}>
              <WaiterDashboard />
            </ProtectedRoute>
          } />
          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
