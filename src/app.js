const path = require('path');
const express = require('express');
const app = express();
const db = require('./db/connection');
const authRoutes = require('./routes/auth');
const { verificarToken, esAdmin } = require('./middlewares/auth');
const port = 3000;


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

//Para Login y registrar usuarios nuevos
app.use('/auth', authRoutes);

// --- RUTAS PARA EL ADMIN (Dashboard) ---

// 1. CREAR un vestido
app.post('/api/vestidos', verificarToken, esAdmin, async (req, res) => {
   const { name, precio_venta, precio_renta, color, talla, imagen, descripcion } = req.body;
   try {
      const query = 'INSERT INTO vestidos (name, precio_venta, precio_renta, color, talla, imagen, descripcion) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
      const values = [name, precio_venta, precio_renta, color, talla, imagen, descripcion];
      const result = await db.query(query, values);
      res.status(201).json({ mensaje: "Vestido creado", vestido: result.rows[0] });
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear el vestido' });
   }
});

// 2. ACTUALIZAR un vestido
app.put('/api/vestidos/:id', verificarToken, esAdmin, async (req, res) => {
   const { id } = req.params;
   const { name, precio_venta, precio_renta, color, talla, imagen, descripcion } = req.body;
   try {
      const query = 'UPDATE vestidos SET name=$1, precio_venta=$2, precio_renta=$3, color=$4, talla=$5, imagen=$6, descripcion=$7 WHERE id=$8 RETURNING *';
      const values = [name, precio_venta, precio_renta, color, talla, imagen, descripcion, id];
      const result = await db.query(query, values);

      if (result.rows.length === 0) return res.status(404).json({ error: "Vestido no encontrado" });

      res.json({ mensaje: "Vestido actualizado", vestido: result.rows[0] });
   } catch (error) {
      res.status(500).json({ error: 'Error al actualizar' });
   }
});

// 3. BORRAR un vestido
app.delete('/api/vestidos/:id', verificarToken, esAdmin, async (req, res) => {
   const { id } = req.params;
   try {
      await db.query('DELETE FROM vestidos WHERE id = $1', [id]);
      res.json({ mensaje: "Vestido eliminado correctamente" });
   } catch (error) {
      res.status(500).json({ error: 'Error al eliminar' });
   }
});



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