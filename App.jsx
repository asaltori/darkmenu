import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CarritoDashboard from './pages/CarritoDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import ClientMenu from './pages/ClientMenu';
import Layout from './components/Layout';
import { useStore } from './context/StoreContext';

function App() {
  const { currentUser } = useStore();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Login />} />
          
          <Route path="admin" element={
            currentUser?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />
          } />
          
          <Route path="carrito" element={
            currentUser?.role === 'carrito' ? <CarritoDashboard /> : <Navigate to="/" />
          } />
          
          <Route path="restaurant" element={
            currentUser?.role === 'restaurant' ? <RestaurantDashboard /> : <Navigate to="/" />
          } />
          
          <Route path="waiter" element={
            currentUser?.role === 'waiter' ? <WaiterDashboard /> : <Navigate to="/" />
          } />
          
          {/* Public Route for Clients */}
          <Route path="menu/:tableId" element={<ClientMenu />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
