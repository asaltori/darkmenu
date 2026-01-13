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
  const [categories, setCategories] = useState([]); // Product Categories
  const [ingredients, setIngredients] = useState([]); // All ingredients
  const [menuItemIngredients, setMenuItemIngredients] = useState([]); // Links between items and ingredients

  // Load initial data
  const fetchData = async () => {
    if (!isSupabaseEnabled) return;
    try {
      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) setUsers(usersData);

      const { data: restData } = await supabase.from('restaurants').select('*');
      if (restData) setRestaurants(restData);
      
      const { data: carritosData } = await supabase.from('carritos').select('*');
      if (carritosData) setCarritos(carritosData);

      // Fetch Categories
      const { data: catsData } = await supabase.from('product_categories').select('*').order('name');
      if (catsData) setCategories(catsData);

      // Fetch Ingredients and Links
      const { data: ingData } = await supabase.from('ingredients').select('*');
      if (ingData) setIngredients(ingData);

      const { data: miiData } = await supabase.from('menu_item_ingredients').select('*');
      if (miiData) setMenuItemIngredients(miiData.map(l => ({
          ...l,
          menuItemId: l.menu_item_id,
          ingredientId: l.ingredient_id,
          isDefault: l.is_default,
          priceAdjustment: l.price_adjustment
      })));

      // Fetch tables sorted by position
      const { data: tablesData } = await supabase.from('tables').select('*').order('position', { ascending: true });
      if (tablesData) setTables(tablesData);

      const { data: itemsData } = await supabase.from('menu_items').select('*');
      if (itemsData) setCarritoItems(itemsData.map(i => ({
          ...i, 
          ownerId: i.owner_id, // Deprecated in V5 favor of carritoId, kept for compat
          carritoId: i.carrito_id,
          costPrice: i.cost_price,
          preparationTime: i.preparation_time,
          categoryId: i.category_id,
          image: i.image_url, // Map image_url to image
          dietaryTags: i.dietary_tags || [] // New Dietary Tags (JSONB or Array)
      })));

      const { data: menuData } = await supabase.from('restaurant_menu_items').select('*');
      if (menuData) setRestaurantMenu(menuData.map(i => ({...i, restaurantId: i.restaurant_id, menuItemId: i.menu_item_id, sellingPrice: i.selling_price})));

      // Fetch orders and merge real-time updates safely
      const { data: ordersData } = await supabase.from('orders').select('*');
      if (ordersData) {
          // Map snake_case to camelCase if needed, or keep consistent
          setOrders(ordersData.map(o => ({
              ...o,
              tableId: o.table_id,
              restaurantId: o.restaurant_id,
              deliveryTime: o.delivery_time,
              startedAt: o.started_at,
              readyAt: o.ready_at,
              dispatchedAt: o.dispatched_at
          })));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to all relevant tables
    const channel = supabase.channel('main_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carritos' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_categories' }, () => fetchData()) // Listen for categories
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_item_ingredients' }, () => fetchData())
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
      await fetchData();
  };

  const updateRestaurant = async (id, updates) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('restaurants').update(updates).eq('id', id);
      await fetchData();
  };

  // Admin: Create Carrito
  const createCarrito = async (name, ownerUserId, address) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('carritos').insert([{ name, owner_user_id: ownerUserId, address }]);
      await fetchData();
  };

  const updateCarrito = async (id, updates) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('carritos').update(updates).eq('id', id);
      await fetchData();
  };

  // Admin: Manage Categories
  const createCategory = async (name) => {
      if (!isSupabaseEnabled) return;
      const { error } = await supabase.from('product_categories').insert([{ name }]);
      if (error) throw error;
      await fetchData();
  };

  const deleteCategory = async (id) => {
      if (!isSupabaseEnabled) return;
      const { error } = await supabase.from('product_categories').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
  };

  // Carrito: Manage Ingredients
  const createIngredient = async (carritoId, name) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('ingredients').insert([{ carrito_id: carritoId, name }]);
      await fetchData();
  };

  const deleteIngredient = async (id) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('ingredients').delete().eq('id', id);
      await fetchData();
  };

  // Carrito: Link Ingredient to Dish
  const linkIngredientToDish = async (menuItemId, ingredientId, isDefault = true) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('menu_item_ingredients').insert([{ 
          menu_item_id: menuItemId, 
          ingredient_id: ingredientId, 
          is_default: isDefault 
      }]);
      await fetchData();
  };

  const unlinkIngredientFromDish = async (linkId) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('menu_item_ingredients').delete().eq('id', linkId);
      await fetchData();
  };

  // Carrito: Manage Menu
  const createDish = async (carritoId, dish) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('menu_items').insert([{
          carrito_id: carritoId,
          name: dish.name,
          description: dish.description,
          cost_price: dish.costPrice,
          preparation_time: dish.preparationTime || 15,
          category_id: dish.categoryId || null,
          image_url: dish.image || null,
          dietary_tags: dish.dietaryTags || [], // Save tags
          active: true,
          // Legacy support (optional, can be removed if strictly V5)
          owner_id: currentUser?.id 
      }]);
      await fetchData();
  };

  const updateDish = async (id, updates) => {
      if (!isSupabaseEnabled) return;
      // Map camelCase to snake_case for DB
      const dbUpdates = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
      if (updates.preparationTime !== undefined) dbUpdates.preparation_time = updates.preparationTime;
      if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
      if (updates.image !== undefined) dbUpdates.image_url = updates.image;
      if (updates.dietaryTags !== undefined) dbUpdates.dietary_tags = updates.dietaryTags; // Update tags
      if (updates.active !== undefined) dbUpdates.active = updates.active;
      
      await supabase.from('menu_items').update(dbUpdates).eq('id', id);
      await fetchData();
  };

  // Admin/Restaurant: Table Management
  const createTable = async (restaurantId, tableNumber) => {
      if (!isSupabaseEnabled) return;
      // Get max position to append - fix logic to avoid error if no tables
      const { data: tables } = await supabase.from('tables').select('position').eq('restaurant_id', restaurantId).order('position', { ascending: false }).limit(1);
      const nextPos = (tables && tables.length > 0) ? tables[0].position + 1 : 0;

      await supabase.from('tables').insert([{ 
          restaurant_id: restaurantId, 
          table_number: tableNumber,
          active: true,
          position: nextPos
      }]);
      await fetchData();
  };

  const updateTable = async (id, updates) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('tables').update(updates).eq('id', id);
      await fetchData();
  };

  const deleteTable = async (id) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('tables').delete().eq('id', id);
      await fetchData();
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
      await fetchData();
  };

  // New Action: Update status of a specific item in the order
  const updateOrderItemStatus = async (orderId, itemId, newStatus) => {
      if (!isSupabaseEnabled) return;
      
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Update the specific item in the array
      const updatedItems = order.items.map(item => {
          if (item.id === itemId) {
              return { ...item, status: newStatus };
          }
          return item;
      });

      // Check if ALL items are ready (e.g. 'listo' or 'entregado' or 'en_camino')
      // If so, we might want to update the master order status, or just leave it.
      // The requirement says: "once all dishes are ready, allow dispatching the complete order".
      // So we just save the item statuses. The UI will handle the "Dispatch" button enablement.
      
      await updateOrder(orderId, { items: updatedItems });
  };
  // New Action: Batch Update Order Items Status
  const updateOrderItemsStatusBatch = async (orderId, itemIds, newStatus) => {
      if (!isSupabaseEnabled) return;
      
      // Fetch latest order data to ensure we don't overwrite concurrent changes
      const { data: orderData } = await supabase.from('orders').select('items').eq('id', orderId).single();
      if (!orderData) return;
      
      const currentItems = orderData.items;

      const updatedItems = currentItems.map(item => {
          if (itemIds.includes(item.id)) {
              return { ...item, status: newStatus };
          }
          return item;
      });
      
      await updateOrder(orderId, { items: updatedItems });
  };

  // Waiter/Client: Place Order
  const placeOrder = async (restaurantId, tableId, items, waiterId = null, tipPercentage = 0) => {
      // items array should contain snapshot of prices and names
      if (!isSupabaseEnabled) return;
      
      // Initialize items with default status 'pendiente'
      const itemsWithStatus = items.map(i => ({ ...i, status: 'pendiente' }));

      const { data } = await supabase.from('orders').insert([{
          restaurant_id: restaurantId,
          table_id: tableId,
          items: itemsWithStatus,
          waiter_id: waiterId,
          tip_percentage: tipPercentage,
          status: waiterId ? 'confirmado' : 'pendiente_confirmacion' // If waiter places it, auto-confirm
      }]).select();
      await fetchData();
      return data ? data[0].id : null;
  };

  const updateOrder = async (orderId, updates) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('orders').update(updates).eq('id', orderId);
      await fetchData();
  };

  const updateOrderStatus = async (orderId, status, deliveryTime = null) => {
      if (!isSupabaseEnabled) return;
      const updateData = { status };
      if (deliveryTime) updateData.delivery_time = deliveryTime;

      // Handle Timestamp Tracking based on Status Transition
      const now = new Date().toISOString();
      if (status === 'en_preparacion') {
          updateData.started_at = now;
      } else if (status === 'listo') {
          updateData.ready_at = now;
      } else if (status === 'en_camino') {
          updateData.dispatched_at = now;
      } else if (status === 'entregado_cliente') {
          updateData.client_delivered_at = now;
      }

      const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
      
      if (error) {
          console.error("Error updating order status:", error);
          // Fallback: Try updating without timestamps if that was the issue (likely missing columns)
          if (error.code === '42703') { // Undefined column
              console.warn("Timestamp columns missing. Retrying without timestamps...");
              const fallbackData = { status };
              if (deliveryTime) fallbackData.delivery_time = deliveryTime;
              await supabase.from('orders').update(fallbackData).eq('id', orderId);
          } else {
              alert("Error al actualizar el pedido: " + error.message);
          }
      }
      
      await fetchData();
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
  const createUser = async (userData) => {
      if (!isSupabaseEnabled) return;
      await supabase.from('users').insert([userData]);
      await fetchData();
  };
  const updateUser = async (id, user) => { 
      if(isSupabaseEnabled) await supabase.from('users').update(user).eq('id', id); 
      await fetchData();
  };
  const deleteUser = async (id) => { 
      if(isSupabaseEnabled) await supabase.from('users').delete().eq('id', id); 
      await fetchData();
  };


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
      categories, // Export categories
      ingredients, // Export ingredients
      menuItemIngredients, // Export links
      tables,
      carritoItems, // Raw items
      restaurantMenu, // Prices
      orders,
      login,
      logout,
      createRestaurant,
      updateRestaurant,
      createCarrito,
      updateCarrito,
      createCategory, // Export
      deleteCategory, // Export
      createIngredient, // Export
      deleteIngredient, // Export
      linkIngredientToDish, // Export
      unlinkIngredientFromDish, // Export
      createTable,
      updateTable,
      deleteTable,
      setRestaurantMenuItem,
      placeOrder,
      updateOrderStatus,
      updateOrderItemStatus,
      updateOrderItemsStatusBatch, // New Batch Action
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
