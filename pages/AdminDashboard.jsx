import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Users, FileText } from 'lucide-react';

const AdminDashboard = () => {
  const { tables, orders, users, menuItems } = useStore();
  const [selectedTable, setSelectedTable] = useState(null);

  // Stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + order.items.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
  }, 0);
  const activeDishes = menuItems.filter(i => i.active).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-gray-500">Total Pedidos</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-gray-500">Usuarios</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
            <QrCode size={24} />
          </div>
          <div>
            <p className="text-gray-500">Mesas Activas</p>
            <p className="text-2xl font-bold">{tables.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <QrCode /> Generador de Códigos QR
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Mesa</label>
            <div className="grid grid-cols-3 gap-3">
              {tables.map(table => (
                <button
                  key={table}
                  onClick={() => setSelectedTable(table)}
                  className={`p-3 rounded border text-center font-medium transition ${
                    selectedTable === table 
                      ? 'bg-orange-600 text-white border-orange-600' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Mesa {table}
                </button>
              ))}
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Este código QR dirigirá a los clientes al menú específico de la mesa seleccionada.</p>
              <p>URL: {window.location.origin}/menu/{selectedTable || 'ID'}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            {selectedTable ? (
              <>
                <div className="bg-white p-4 rounded shadow-sm mb-4">
                  <QRCodeSVG 
                    value={`${window.location.origin}/menu/${selectedTable}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="font-bold text-lg mb-2">Mesa {selectedTable}</p>
                <button 
                  onClick={() => window.print()}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Imprimir Código QR
                </button>
              </>
            ) : (
              <p className="text-gray-400">Selecciona una mesa para generar el QR</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
