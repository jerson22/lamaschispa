import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const navigate = useNavigate();

   const handleSubmit = async (e) => {
      e.preventDefault();
      try {
         const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
         });

         const data = await response.json();

         if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/admin');
         } else {
            setError(data.error || 'Error al iniciar sesión');
         }
      } catch (err) {
         setError('Error de conexión con el servidor');
      }
   };

   return (
      <div className="login-container">
         <form className="login-form" onSubmit={handleSubmit}>
            <h2>Inicia Sesión</h2>
            {error && <p className="error-msg">{error}</p>}
            <div className="input-group">
               <label>Email</label>
               <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
               />
            </div>
            <div className="input-group">
               <label>Contraseña</label>
               <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
               />
            </div>
            <button type="submit" className="login-btn">Entrar</button>
         </form>

         <style>{`
            .login-container {
               display: flex;
               justify-content: center;
               align-items: center;
               min-height: 70vh;
            }
            .login-form {
               background: white;
               padding: 40px;
               border-radius: 20px;
               box-shadow: 0 10px 25px rgba(0,0,0,0.1);
               width: 100%;
               max-width: 400px;
            }
            .login-form h2 {
               text-align: center;
               color: #db2777;
               font-family: 'Caveat', cursive;
               font-size: 2.5rem;
               margin-bottom: 25px;
            }
            .input-group {
               margin-bottom: 20px;
            }
            .input-group label {
               display: block;
               margin-bottom: 8px;
               color: #666;
               font-weight: 600;
            }
            .input-group input {
               width: 100%;
               padding: 12px;
               border: 2px solid #fce7f3;
               border-radius: 10px;
               outline: none;
               transition: border-color 0.3s;
            }
            .input-group input:focus {
               border-color: #f472b6;
            }
            .login-btn {
               width: 100%;
               background: #f472b6;
               color: white;
               border: none;
               padding: 15px;
               border-radius: 10px;
               font-weight: bold;
               cursor: pointer;
               font-size: 1.1rem;
               transition: background 0.3s;
            }
            .login-btn:hover {
               background: #db2777;
            }
            .error-msg {
               color: #ef4444;
               background: #fee2e2;
               padding: 10px;
               border-radius: 8px;
               text-align: center;
               margin-bottom: 20px;
               font-size: 0.9rem;
            }
         `}</style>
      </div>
   );
};

export default Login;
