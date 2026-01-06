import React, { createContext, useState, useContext } from 'react';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  // Mock Data
  const [currentUser, setCurrentUser] = useState(null); // { id, role, name }

  const [users] = useState([
    { id: 1, username: 'admin', role: 'admin', name: 'Administrador' },
    { id: 2, username: 'carrito1', role: 'carrito', name: 'Carrito de Tacos' },
    { id: 3, username: 'carrito2', role: 'carrito', name: 'Carrito de Burgers' },
    { id: 4, username: 'restaurant', role: 'restaurant', name: 'El Gran Restaurant' },
    { id: 5, username: 'waiter1', role: 'waiter', name: 'Camarero Juan' },
  ]);

  const [menuItems, setMenuItems] = useState([
    { id: 1, ownerId: 2, name: 'Taco al Pastor', description: 'Delicioso taco', costPrice: 10, sellingPrice: 15, active: true },
    { id: 2, ownerId: 2, name: 'Taco de Asada', description: 'Carne asada', costPrice: 12, sellingPrice: 18, active: true },
    { id: 3, ownerId: 3, name: 'Hamburguesa Clásica', description: 'Con queso', costPrice: 50, sellingPrice: 80, active: true },
  ]);

  const [orders, setOrders] = useState([]);
  const [tables] = useState([1, 2, 3, 4, 5]);

  const login = (username) => {
    const user = users.find(u => u.username === username);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  // Carrito Actions
  const updateDishStatus = (id, active) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, active } : item));
  };

  const updateDishCost = (id, costPrice) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, costPrice } : item));
  };
  
  const notifyDispatch = (orderId) => {
    // In a real app, this would notify the restaurant/waiter
    console.log(`Order ${orderId} dispatched from carrito`);
    updateOrderStatus(orderId, 'en_camino');
  };

  // Restaurant Actions
  const updateSellingPrice = (id, sellingPrice) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, sellingPrice } : item));
  };

  // Waiter/Customer Actions
  const placeOrder = (tableId, items) => {
    const newOrder = {
      id: Date.now(),
      tableId,
      items, // [{ itemId, quantity, ... }]
      status: 'pendiente', // pendiente, confirmado, en_camino, entregado
      timestamp: new Date().toISOString(),
    };
    setOrders(prev => [...prev, newOrder]);
    return newOrder.id;
  };

  const updateOrderStatus = (orderId, status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  return (
    <StoreContext.Provider value={{
      currentUser,
      users,
      menuItems,
      orders,
      tables,
      login,
      logout,
      updateDishStatus,
      updateDishCost,
      updateSellingPrice,
      placeOrder,
      updateOrderStatus,
      notifyDispatch
    }}>
      {children}
    </StoreContext.Provider>
  );
};
