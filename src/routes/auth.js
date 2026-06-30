import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';

const router = express.Router();

// Ruta para registrar usuarios (Tú la usarás para crear al Admin y clientes)
router.post('/register', async (req, res) => {
   const { nombre, email, password, rol } = req.body;

   try {
      // 1. Encriptar la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 2. Guardar en la base de datos
      const query = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol';
      const values = [nombre, email, hashedPassword, rol || 'cliente'];

      const result = await db.query(query, values);
      res.status(201).json(result.rows[0]);
   } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al registrar usuario. ¿Quizás el email ya existe?' });
   }
});

// Ruta de Login
router.post('/login', async (req, res) => {
   const { email, password } = req.body;

   try {
      // 1. Buscar usuario
      const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      if (result.rows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });

      const user = result.rows[0];

      // 2. Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Contraseña incorrecta' });

      // 3. GENERAR EL JWT
      const token = jwt.sign(
         { id: user.id, rol: user.rol }, // Lo que queremos que el token "sepa"
         process.env.JWT_SECRET,          // Tu llave secreta del .env
         { expiresIn: '2h' }              // Cuánto dura la sesión
      );

      res.json({ token, user: { nombre: user.nombre, rol: user.rol } });
   } catch (err) {
      res.status(500).json({ error: 'Error en el servidor' });
   }
});

// Ruta para validar token (verificar que siga siendo válido)
router.get('/validate', (req, res) => {
   const token = req.header('auth-token');
   if (!token) return res.status(401).json({ error: 'No hay token' });

   try {
      const verificado = jwt.verify(token, process.env.JWT_SECRET);
      // Si llegamos aquí, el token es válido
      res.json({ valid: true, user: { id: verificado.id, rol: verificado.rol } });
   } catch (error) {
      // Token inválido, expirado, o malformado
      res.status(401).json({ error: 'Token inválido o expirado' });
   }
});

export default router;