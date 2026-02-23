const path = require('path');
const express = require('express');
const app = express();
const db = require('./db/connection');
const port = 3000;

app.use(express.json());
// Servimos estáticos desde la carpeta public que está al lado de app.js
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para probar la conexión a la base de datos
app.get('/db-test', async (req, res) => {
   try {
      const result = await db.query('SELECT NOW()');
      res.json({
         message: 'Conexión exitosa',
         time: result.rows[0].now
      });
   } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al conectar con la base de datos' });
   }
});

// Endpoint para obtener todos los vestidos
app.get('/api/vestidos', async (req, res) => {
   try {
      // Filtramos los que no tengan nombre para evitar mostrar filas vacías de pgAdmin
      const result = await db.query('SELECT * FROM vestidos WHERE name IS NOT NULL ORDER BY id ASC');
      res.json(result.rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener los vestidos de la base de datos' });
   }
});

// Ejemplo: ruta que consulta la base de datos
app.get('/api/productos', async (req, res) => {
   try {
      const result = await db.query('SELECT * FROM productos');
      res.json(result.rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en la base de datos' });
   }
});

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`);
});