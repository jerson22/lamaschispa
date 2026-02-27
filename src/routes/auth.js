const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

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

      // 3. GENERAR EL JWT (Aquí está el truco)
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

module.exports = router;