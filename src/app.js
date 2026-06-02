const path = require('path');
const express = require('express');
const app = express();
const db = require('./db/connection');
const authRoutes = require('./routes/auth');
const { verificarToken, esAdmin } = require('./middlewares/auth');
const port = 3000;

const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      const dir = path.join(__dirname, 'public', 'images');
      if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
   },
   filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
   }
});
const upload = multer({ storage: storage });


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public', 'dist')));

//Para Login y registrar usuarios nuevos
app.use('/auth', authRoutes);

// Endpoint para subir imágenes rápidamente
app.post('/api/upload', verificarToken, esAdmin, upload.array('images', 10), (req, res) => {
   try {
      const filenames = req.files.map(f => f.filename);
      res.json({ filenames });
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir las imágenes' });
   }
});

// 1. CREAR un producto
app.post('/api/productos', verificarToken, esAdmin, async (req, res) => {
   const { name, precio_venta, precio_renta, color, talla, silueta, mangas, descripcion, vestido, imagenes } = req.body;
   try {
      await db.query('BEGIN');
      const query = 'INSERT INTO productos (name, precio_venta, precio_renta, color, talla, silueta, mangas, descripcion, vestido) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
      const values = [name, precio_venta, precio_renta, color, talla, silueta, mangas, descripcion, vestido ? '1' : '0'];
      // console.log("Values:", values);
      const result = await db.query(query, values);
      const producto_id = result.rows[0].id;

      let imagesInserted = [];
      if (imagenes && imagenes.length > 0) {
         for (let i = 0; i < imagenes.length; i++) {
            if (!imagenes[i]) continue;
            const imgQuery = 'INSERT INTO imagen_productos (id_imagen, name, orden) VALUES ($1, $2, $3) RETURNING name';
            const imgResult = await db.query(imgQuery, [producto_id, imagenes[i], i + 1]);
            imagesInserted.push(imgResult.rows[0].name);
         }
      }
      await db.query('COMMIT');
      res.status(201).json({ mensaje: "Producto creado", producto: { ...result.rows[0], imagenes: imagesInserted } });
   } catch (error) {
      await db.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Error al crear el producto' });
   }
});

// 2. ACTUALIZAR un producto
app.put('/api/productos/:id', verificarToken, esAdmin, async (req, res) => {
   const { id } = req.params;
   const { name, precio_venta, precio_renta, color, talla, silueta, mangas, descripcion, vestido, imagenes } = req.body;
   try {
      await db.query('BEGIN');
      const query = 'UPDATE productos SET name=$1, precio_venta=$2, precio_renta=$3, color=$4, talla=$5, silueta=$6, mangas=$7, descripcion=$8, vestido=$9 WHERE id=$10 RETURNING *';
      const values = [name, precio_venta, precio_renta, color, talla, silueta, mangas, descripcion, vestido ? '1' : '0', id];
      // console.log("Values:", values);
      const result = await db.query(query, values);

      if (result.rows.length === 0) {
         await db.query('ROLLBACK');
         return res.status(404).json({ error: "Producto no encontrado" });
      }

      await db.query('DELETE FROM imagen_productos WHERE id_imagen = $1', [id]);
      let imagesInserted = [];
      if (imagenes && imagenes.length > 0) {
         for (let i = 0; i < imagenes.length; i++) {
            if (!imagenes[i]) continue;
            const imgQuery = 'INSERT INTO imagen_productos (id_imagen, name, orden) VALUES ($1, $2, $3) RETURNING name';
            const imgResult = await db.query(imgQuery, [id, imagenes[i], i + 1]);
            imagesInserted.push(imgResult.rows[0].name);
         }
      }
      await db.query('COMMIT');
      res.json({ mensaje: "Producto actualizado", producto: { ...result.rows[0], imagenes: imagesInserted } });
   } catch (error) {
      await db.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar' });
   }
});

// 3. BORRAR un producto
app.delete('/api/productos/:id', verificarToken, esAdmin, async (req, res) => {
   const { id } = req.params;
   try {
      await db.query('BEGIN');
      await db.query('DELETE FROM imagen_productos WHERE id_imagen = $1', [id]);
      await db.query('DELETE FROM productos WHERE id = $1', [id]);
      await db.query('COMMIT');
      res.json({ mensaje: "Producto eliminado correctamente" });
   } catch (error) {
      await db.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar' });
   }
});

// Endpoint para obtener TODOS los productos (para Admin)
app.get('/api/productos', async (req, res) => {
   try {
      const query = `
         SELECT p.*, 
               COALESCE(
                  (SELECT json_agg(ia.name ORDER BY ia.orden) 
                  FROM imagen_productos ia 
                  WHERE ia.id_imagen = p.id), 
                  '[]'
               ) as imagenes
         FROM productos p 
         ORDER BY p.id ASC
      `;
      const result = await db.query(query);
      res.json(result.rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener los productos' });
   }
});

// Endpoint para obtener un producto por ID
app.get('/api/productos/:id', async (req, res) => {
   const { id } = req.params;
   try {
      const query = `
         SELECT p.*, 
               COALESCE(
                  (SELECT json_agg(ia.name ORDER BY ia.orden) 
                  FROM imagen_productos ia 
                  WHERE ia.id_imagen = p.id), 
                  '[]'
               ) as imagenes
         FROM productos p 
         WHERE p.id = $1
      `;
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
         return res.status(404).json({ error: "Producto no encontrado" });
      }

      res.json(result.rows[0]);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el producto' });
   }
});

app.get('/api/clientes', verificarToken, esAdmin, async (req, res) => {
   try {
      const result = await db.query('SELECT * FROM clientes ORDER BY id ASC');
      res.json(result.rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener los clientes' });
   }
});

app.post('/api/clientes', verificarToken, esAdmin, async (req, res) => {
   const { nombre, telefono, email, direccion } = req.body;
   try {
      const result = await db.query(
         'INSERT INTO clientes (nombre, telefono, email, direccion) VALUES ($1, $2, $3, $4) RETURNING *',
         [nombre, telefono, email, direccion]
      );
      res.status(201).json(result.rows[0]);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear el cliente' });
   }
});

app.post('/api/reservas', verificarToken, esAdmin, async (req, res) => {
   const { clienteId, fechaEvento, fechaEntrega, fechaDevolucion, estado, total, tipo, items } = req.body;
   if (!clienteId || !fechaEvento || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos para crear la reserva' });
   }

   try {
      await db.query('BEGIN');
      const reservaResult = await db.query(
         'INSERT INTO reserva (clienteid, fechaevento, fechaentrega, fechadevolucion, estado, total, tipo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
         [clienteId, fechaEvento, fechaEntrega || null, fechaDevolucion || null, estado, total, tipo]
      );
      const reservaId = reservaResult.rows[0].id;

      for (const item of items) {
         await db.query(
            'INSERT INTO reservaitem (reservaid, productoid, cantidad, rol, estadoitem, preciounitario, notas) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [reservaId, item.productoId, item.cantidad || 1, item.rol, item.estadoItem, item.precioUnitario || 0, item.notas || '']
         );
      }

      await db.query('COMMIT');
      res.status(201).json({ mensaje: 'Reserva creada', reservaId });
   } catch (error) {
      await db.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Error al crear la reserva' });
   }
});

// Endpoint para obtener todas las reservas con productos y cliente
app.get('/api/reservas', verificarToken, esAdmin, async (req, res) => {
   try {
      const query = `
         SELECT
            r.id,
            r.fechaevento,
            r.fechaentrega,
            r.fechadevolucion,
            r.estado,
            r.total,
            r.tipo,
            c.nombre AS cliente,
            json_agg(
               json_build_object(
                  'productoId', p.id,
                  'productoNombre', p.name,
                  'rol', ri.rol,
                  'precioUnitario', ri.preciounitario,
                  'estadoItem', ri.estadoitem
               ) ORDER BY ri.id
            ) AS items
         FROM reserva r
         JOIN clientes c ON c.id = r.clienteid
         JOIN reservaitem ri ON ri.reservaid = r.id
         JOIN productos p ON p.id = ri.productoid
         GROUP BY r.id, c.nombre
         ORDER BY r.fechaevento ASC, r.id ASC
      `;
      const result = await db.query(query);
      res.json(result.rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener las reservas' });
   }
});

// Endpoint para obtener reservas de un producto específico
app.get('/api/productos/:id/reservas', verificarToken, async (req, res) => {
   const { id } = req.params;
   try {
      const query = `
         SELECT
            r.id,
            r.fechaevento,
            r.fechaentrega,
            r.fechadevolucion,
            r.estado,
            c.nombre AS cliente
         FROM reservaitem ri
         JOIN reserva r ON r.id = ri.reservaid
         JOIN clientes c ON c.id = r.clienteid
         WHERE ri.productoid = $1
         ORDER BY r.fechaevento ASC, r.id ASC
      `;
      const result = await db.query(query, [id]);
      res.json(result.rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener las reservas del producto' });
   }
});

app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'dist', 'index.html'));
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
      const query = `
         SELECT p.*, 
               COALESCE(
                  (SELECT json_agg(ia.name ORDER BY ia.orden) 
                  FROM imagen_productos ia 
                  WHERE ia.id_imagen = p.id), 
                  '[]'
               ) as imagenes
         FROM productos p 
         WHERE p.name IS NOT NULL AND p.vestido = '1'
         ORDER BY p.id ASC
      `;
      const result = await db.query(query);
      res.json(result.rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener los vestidos de la base de datos' });
   }
});

// Endpoint para obtener todos los accesorios
app.get('/api/accesorios', async (req, res) => {
   try {
      const query = `
         SELECT p.*, 
               COALESCE(
                  (SELECT json_agg(ia.name ORDER BY ia.orden) 
                  FROM imagen_productos ia 
                  WHERE ia.id_imagen = p.id), 
                  '[]'
               ) as imagenes
         FROM productos p 
         WHERE p.name IS NOT NULL AND p.vestido = '0'
         ORDER BY p.id ASC
      `;
      const result = await db.query(query);
      res.json(result.rows);
   } catch (error) {
      console.error("Error en DB:", error.message);
      res.status(500).json({ error: 'Error en la base de datos', details: error.message });
   }
});

// Ruta comodín para servir index.html en todas las rutas no-API
// Esto permite que React Router maneje el routing del cliente
app.get(/^(?!\/api\/).*$/, (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'dist', 'index.html'));
});

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`);
});