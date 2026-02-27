const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
   // 1. Obtener el token del header de la petición
   const token = req.header('auth-token');
   if (!token) return res.status(401).json({ error: 'Acceso denegado. No hay token.' });

   try {
      // 2. Verificar si el token es válido
      const verificado = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verificado; // Guardamos los datos del usuario en la petición
      next(); // Continuamos a la siguiente función
   } catch (error) {
      res.status(400).json({ error: 'Token no es válido' });
   }
};

// Middleware para verificar si es Admin
const esAdmin = (req, res, next) => {
   if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Admin.' });
   }
   next();
};

module.exports = { verificarToken, esAdmin };