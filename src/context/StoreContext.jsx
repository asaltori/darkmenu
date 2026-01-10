import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const isSupabaseEnabled = !!supabase;

  // State
  const [currentUser, setCurrentUser] = useState(null);
  
  // Collections
  const [users, setUsers] = useState([]); // All users
  const [restaurants, setRestaurants] = useState([]); // All restaurants
  const [carritos, setCarritos] = useState([]); // All carritos
  const [tables, setTables] = useState([]); // All tables (or filtered)
  const [carritoItems, setCarritoItems] = useState([]); // Raw items from carritos (menu_items table)
  const [restaurantMenu, setRestaurantMenu] = useState([]); // Price overrides (restaurant_menu_items table)
  const [orders, setOrders] = useState([]); // Orders

  // Load initial data
  useEffect(() => {
    if (!isSupabaseEnabled) {
        return;
    }

    const fetchData = async () => {
      try {
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) setUsers(usersData);

        const { data: restData } = await supabase.from('restaurants').select('*');
        if (restData) setRestaurants(restData);
        
        const { data: carritosData } = await supabase.from('carritos').select('*');
        if (carritosData) setCarritos(carritosData);

        // Fetch tables sorted by position
        const { data: tablesData } = await supabase.from('tables').select('*').order('position', { ascending: true });
        if (tablesData) setTables(tablesData);

        const { data: itemsData } = await supabase.from('menu_items').select('*');
        if (itemsData) setCarritoItems(itemsData.map(i => ({
            ...i, 
            ownerId: i.owner_id, // Deprecated in V5 favor of carritoId, kept for compat
            carritoId: i.carrito_id,
            costPrice: i.cost_price,
            preparationTime: i.preparation_time
        })));

        const { data: menuData } = await supabase.from('restaurant_menu_items').select('*');
        if (menuData) setRestaurantMenu(menuData.map(i => ({...i, restaurantId: i.restaurant_id, menuItemId: i.menu_item_id, sellingPrice: i.selling_price})));

        const { data: ordersData } = await supabase.from('orders').select('*');
        if (ordersData) {
            setOrders(ordersData.map(o => ({
                ...o,
                tableId: o.table_id,
                restaurantId: o.restaurant_id,
                deliveryTime: o.delivery_time
            })));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    fetchData();

    // Subscribe to all relevant tables
    const channel = supabase.channel('main_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carritos' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_menu_items' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSupabaseEnabled]);

  // --- Actions ---

  const login = async (username, password) => {
    if (isSupabaseEnabled) {
        const { data } = await supabase.from('users').select('*').eq('username', username).single();
        if (data && data.password === password) {
            setCurrentUser(data);
            return true;
        }
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  // Admin: Create Restaurant
  const createRestaurant = async (name, ownerUserId) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('restaurants').insert([{ name, owner_user_id: ownerUserId }]);
  };

  // Admin/Restaurant: Table Management
  const createTable = async (restaurantId, tableNumber) => {
      if (!isSupabaseEnabled) return;
      // Get max position to append
      const { count } = await supabase.from('tables').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId);
      await supabase.from('tables').insert([{ 
          restaurant_id: restaurantId, 
          table_number: tableNumber,
          active: true,
          position: count || 0
      }]);
  };

  const updateTable = async (id, updates) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('tables').update(updates).eq('id', id);
  };

  const deleteTable = async (id) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('tables').delete().eq('id', id);
  };

  // Restaurant: Add Item to Menu (or update price)
  const setRestaurantMenuItem = async (restaurantId, menuItemId, sellingPrice, active = true) => {
      if (!isSupabaseEnabled) return;
      
      // Check if exists
      const existing = restaurantMenu.find(rm => rm.restaurantId === restaurantId && rm.menuItemId === menuItemId);
      
      if (existing) {
          await supabase.from('restaurant_menu_items').update({ selling_price: sellingPrice, active }).eq('id', existing.id);
      } else {
          await supabase.from('restaurant_menu_items').insert([{ 
              restaurant_id: restaurantId, 
              menu_item_id: menuItemId, 
              selling_price: sellingPrice, 
              active 
          }]);
      }
  };

  // Waiter/Client: Place Order
  const placeOrder = async (restaurantId, tableId, items, waiterId = null, tipPercentage = 0) => {
      // items array should contain snapshot of prices and names
      if (!isSupabaseEnabled) return;
      
      const { data } = await supabase.from('orders').insert([{
          restaurant_id: restaurantId,
          table_id: tableId,
          items,
          waiter_id: waiterId,
          tip_percentage: tipPercentage,
          status: waiterId ? 'confirmado' : 'pendiente_confirmacion' // If waiter places it, auto-confirm
      }]).select();
      return data ? data[0].id : null;
  };

  const updateOrder = async (orderId, updates) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('orders').update(updates).eq('id', orderId);
  };

  const updateOrderStatus = async (orderId, status, deliveryTime = null) => {
      if (!isSupabaseEnabled) return;
      const updateData = { status };
      if (deliveryTime) updateData.delivery_time = deliveryTime;
      await supabase.from('orders').update(updateData).eq('id', orderId);
  };
  
  // Carrito Actions (Update Cost)
  const updateDishCost = async (itemId, costPrice) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('menu_items').update({ cost_price: costPrice }).eq('id', itemId);
  };
  
  const updateDishStatus = async (itemId, active) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('menu_items').update({ active }).eq('id', itemId);
  };
  
  // User Management
  const createUser = async (user) => { if(isSupabaseEnabled) await supabase.from('users').insert([user]); };
  const updateUser = async (id, user) => { if(isSupabaseEnabled) await supabase.from('users').update(user).eq('id', id); };
  const deleteUser = async (id) => { if(isSupabaseEnabled) await supabase.from('users').delete().eq('id', id); };


  // Helpers
  const getRestaurantByOwner = (userId) => restaurants.find(r => r.owner_user_id === userId);
  const getCarritoByOwner = (userId) => carritos.find(c => c.owner_user_id === userId);

  const getMyRestaurant = () => {
      if (!currentUser) return null;
      if (currentUser.role === 'restaurant') return getRestaurantByOwner(currentUser.id);
      if (currentUser.role === 'waiter') return restaurants.find(r => r.id === currentUser.restaurant_id);
      return null;
  };

  const getMyCarrito = () => {
      if (!currentUser || currentUser.role !== 'carrito') return null;
      return getCarritoByOwner(currentUser.id);
  };

  return (
    <StoreContext.Provider value={{
      isSupabaseEnabled,
      currentUser,
      users,
      restaurants,
      carritos,
      tables,
      carritoItems, // Raw items
      restaurantMenu, // Prices
      orders,
      login,
      logout,
      createRestaurant,
      createCarrito,
      updateCarrito,
      createTable,
      updateTable,
      deleteTable,
      setRestaurantMenuItem,
      placeOrder,
      updateOrderStatus,
      updateOrder,
      updateDishCost, // Legacy
      updateDishStatus, // Legacy
      createDish,
      updateDish,
      createUser,
      updateUser,
      deleteUser,
      getMyRestaurant,
      getMyCarrito
    }}>
      {children}
    </StoreContext.Provider>
  );
};
