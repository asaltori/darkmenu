import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const Login = () => {
  const { users, login } = useStore();
  const navigate = useNavigate();

  const handleLogin = (username, role) => {
    if (login(username)) {
      switch (role) {
        case 'admin': navigate('/admin'); break;
        case 'carrito': navigate('/carrito'); break;
        case 'restaurant': navigate('/restaurant'); break;
        case 'waiter': navigate('/waiter'); break;
        default: navigate('/');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Bienvenido a RestoPlatform</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl mb-4 font-semibold text-center">Selecciona tu Rol (Simulación)</h2>
        <div className="space-y-3">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => handleLogin(user.username, user.role)}
              className="w-full p-3 text-left border rounded hover:bg-orange-50 transition flex justify-between items-center group"
            >
              <span className="font-medium">{user.name}</span>
              <span className="text-sm text-gray-500 group-hover:text-orange-600 uppercase">{user.role}</span>
            </button>
          ))}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-center mb-2 font-medium">Acceso Clientes</h3>
            <button
              onClick={() => navigate('/menu/1')}
              className="w-full p-3 bg-orange-600 text-white rounded hover:bg-orange-700 text-center"
            >
              Escanear QR (Simular Mesa 1)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
