import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  // Check if Supabase is configured
  const isSupabaseEnabled = !!supabase;

  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([
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

  // Load initial data from Supabase
  useEffect(() => {
    if (!isSupabaseEnabled) return;

    const fetchData = async () => {
      try {
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) setUsers(usersData);

        const { data: menuData } = await supabase.from('menu_items').select('*');
        // Map snake_case to camelCase if needed, or adjust usage. 
        // For simplicity, let's keep consistency. 
        // DB columns: owner_id, cost_price, selling_price
        // App expects: ownerId, costPrice, sellingPrice
        if (menuData) {
          setMenuItems(menuData.map(item => ({
            ...item,
            ownerId: item.owner_id,
            costPrice: item.cost_price,
            sellingPrice: item.selling_price
          })));
        }

        const { data: ordersData } = await supabase.from('orders').select('*');
        if (ordersData) {
            setOrders(ordersData.map(o => ({
                ...o,
                tableId: o.table_id,
                // created_at is automatic
            })));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    fetchData();

    // Realtime Subscriptions
    const channel = supabase.channel('main_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, (payload) => {
        // Refresh menu on change
        // For simplicity, we just fetch all or update local state based on payload
        // Ideally: optimistic update or detailed merge. 
        // Let's re-fetch to be safe and simple
        fetchData(); 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSupabaseEnabled]);


  const login = async (username) => {
    if (isSupabaseEnabled) {
        const { data } = await supabase.from('users').select('*').eq('username', username).single();
        if (data) {
            setCurrentUser(data);
            return true;
        }
        return false;
    } else {
        const user = users.find(u => u.username === username);
        if (user) {
          setCurrentUser(user);
          return true;
        }
        return false;
    }
  };

  const logout = () => setCurrentUser(null);

  // Carrito Actions
  const updateDishStatus = async (id, active) => {
    if (isSupabaseEnabled) {
        await supabase.from('menu_items').update({ active }).eq('id', id);
        // State updates via subscription
    } else {
        setMenuItems(prev => prev.map(item => item.id === id ? { ...item, active } : item));
    }
  };

  const updateDishCost = async (id, costPrice) => {
    if (isSupabaseEnabled) {
        await supabase.from('menu_items').update({ cost_price: costPrice }).eq('id', id);
    } else {
        setMenuItems(prev => prev.map(item => item.id === id ? { ...item, costPrice } : item));
    }
  };
  
  const notifyDispatch = async (orderId) => {
    console.log(`Order ${orderId} dispatched from carrito`);
    updateOrderStatus(orderId, 'en_camino');
  };

  // Restaurant Actions
  const updateSellingPrice = async (id, sellingPrice) => {
    if (isSupabaseEnabled) {
        await supabase.from('menu_items').update({ selling_price: sellingPrice }).eq('id', id);
    } else {
        setMenuItems(prev => prev.map(item => item.id === id ? { ...item, sellingPrice } : item));
    }
  };

  // Waiter/Customer Actions
  const placeOrder = async (tableId, items) => {
    if (isSupabaseEnabled) {
        const { data } = await supabase.from('orders').insert([{
            table_id: tableId,
            items: items,
            status: 'pendiente'
        }]).select();
        return data ? data[0].id : null;
    } else {
        const newOrder = {
          id: Date.now(),
          tableId,
          items, 
          status: 'pendiente', 
          timestamp: new Date().toISOString(),
        };
        setOrders(prev => [...prev, newOrder]);
        return newOrder.id;
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    if (isSupabaseEnabled) {
        await supabase.from('orders').update({ status }).eq('id', orderId);
    } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    }
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
      notifyDispatch,
      isSupabaseEnabled // Export flag to show UI status
    }}>
      {children}
    </StoreContext.Provider>
  );
};
