import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isSupabaseEnabled } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!isSupabaseEnabled) {
      setError('Error crítico: No hay conexión con la base de datos (Faltan variables de entorno).');
      return;
    }

    const success = await login(username, password);
    if (success) {
      // Redirigir según el rol del usuario (esto se manejará en App.jsx o aquí mismo)
      // Pero como App.jsx redirige, aquí solo necesitamos que el estado cambie.
      // Sin embargo, para mejor UX, podemos redirigir manualmente:
      // Dejaremos que el componente Login redirija basado en el usuario que ahora está en el context
      // O mejor, App.jsx puede observar el currentUser y redirigir, pero eso puede causar bucles si no se hace bien.
      // Lo más seguro es redirigir aquí.
      
      // Obtenemos el usuario del context? No, login es async pero el estado puede tardar un tick.
      // Pero login devuelve true si éxito.
      // Asumiremos que el estado se actualizó.
      
      // Hack: leer el rol "teóricamente" o esperar que App.jsx redirija si está en ruta pública.
      // Vamos a redirigir explícitamente.
    } else {
      setError('Credenciales incorrectas');
    }
  };

  // Redirección post-login
  const { currentUser } = useStore();
  React.useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
        case 'admin': navigate('/admin'); break;
        case 'carrito': navigate('/carrito'); break;
        case 'restaurant': navigate('/restaurant'); break;
        case 'waiter': navigate('/waiter'); break;
        default: navigate('/');
      }
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Iniciar Sesión</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ej: admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition font-medium"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Credenciales Demo:</p>
          <p><strong>carrito_demo</strong> / 1234</p>
          <p><strong>rest_demo</strong> / 1234</p>
          <p>admin / admin</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
