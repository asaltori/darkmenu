import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';

const ClientMenu = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { menuItems, placeOrder } = useStore();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Only show active items
  const activeItems = menuItems.filter(item => item.active);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

  const handleOrder = () => {
    if (cart.length === 0) return;
    placeOrder(tableId, cart);
    alert('¡Pedido realizado con éxito! Un camarero confirmará tu orden pronto.');
    setCart([]);
    setIsCartOpen(false);
  };

  return (
    <div className="pb-20">
      <header className="bg-orange-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Menú Digital - Mesa {tableId}</h1>
          <button 
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="relative p-2"
          >
            <ShoppingCart />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-orange-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
              <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-400">
                {/* Placeholder for image */}
                <span className="text-4xl">🍽️</span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <span className="font-bold text-orange-600 text-lg">${item.sellingPrice}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex-1">{item.description}</p>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-full bg-orange-100 text-orange-700 py-2 rounded hover:bg-orange-200 font-medium flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col animate-slide-in">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold">Tu Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">Tu carrito está vacío</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-gray-500 text-sm">${item.sellingPrice} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded bg-gray-100">
                        <Minus size={16} />
                      </button>
                      <span className="w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded bg-gray-100">
                        <Plus size={16} />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-2 text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between text-xl font-bold mb-4">
                <span>Total</span>
                <span>${total}</span>
              </div>
              <button 
                onClick={handleOrder}
                disabled={cart.length === 0}
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
              >
                Confirmar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Trash icon since I forgot to import it in the component but used it
import { Trash2 } from 'lucide-react';

export default ClientMenu;
