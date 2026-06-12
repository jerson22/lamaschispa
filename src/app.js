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
   const { nombre, telefono, email, municipio } = req.body;
   try {
      const result = await db.query(
         'INSERT INTO clientes (nombre, telefono, email, municipio) VALUES ($1, $2, $3, $4) RETURNING *',
         [nombre, telefono, email, municipio]
      );
      res.status(201).json(result.rows[0]);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear el cliente' });
   }
});

// insertar ventas
app.post('/api/ventas', verificarToken, esAdmin, async (req, res) => {
   console.log("Datos recibidos para venta:", req.body);
   const { name, productId, bolso, aretes, ajuste, fechaAjustes, fechaRenta, fechaEntrega, fechaDevolucion, anticipoEfectivo, anticipoTarjeta, pendienteEfectivo, pendienteTarjeta, liquidado, notas } = req.body;
   if (!name || !fechaRenta || !fechaEntrega || !fechaDevolucion || anticipoEfectivo === undefined && anticipoTarjeta === undefined) {
      return res.status(400).json({ error: 'Datos incompletos para crear la venta' });
   }
   try {
      const isTrue = (val) => val === true || val === 1 || val === '1';
      const estado = isTrue(ajuste) ? 'cita de ajustes' : 'planchado';
      const ventasResult = await db.query(
         'INSERT INTO ventas ( "name", "productId", "bolso", "aretes", "ajuste", "fechaAjuste", "estado", "fechaRenta", "fechaEntrega", "fechaDevolucion", "anticipoEfectivo", "anticipoTarjeta", "pendienteEfectivo", "pendienteTarjeta", "liquidado", "notas") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *',
         [ name, productId || null, isTrue(bolso) ? '1' : '0', isTrue(aretes) ? '1' : '0', isTrue(ajuste) ? '1' : '0', fechaAjustes || null, estado, fechaRenta || null, fechaEntrega || null, fechaDevolucion || null, anticipoEfectivo, anticipoTarjeta, pendienteEfectivo, pendienteTarjeta, isTrue(liquidado) ? '1' : '0', notas]
      );
      const reservaId = ventasResult.rows[0].id;

      res.status(201).json({ mensaje: 'Venta creada', reservaId });
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear la venta' });
   }
});

// Traer ventas para la tabla rentas
app.get('/api/rentas', verificarToken, esAdmin, async (req, res) => {
   try {
      const result = await db.query('SELECT * FROM ventas ORDER BY "fechaEntrega" ASC');
      res.json(result.rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener las rentas' });
   }
});

// Endpoint para actualizar el estado de una renta
app.put('/api/rentas/:id', verificarToken, esAdmin, async (req, res) => {
   const { id } = req.params;       // Captura el ID desde la URL
   const { estado } = req.body;     // Captura el nuevo estado enviado desde React

   // 1. Validación básica (opcional pero recomendada)
   const estadosValidos = ['cita de ajustes', 'ajustes', 'planchado', 'entregado', 'devolucion', 'tintoreria', 'en tienda'];
   if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
   }

   try {
      // 2. Consulta SQL usando marcadores ($1, $2) para evitar inyección SQL
      // Nota: Aquí usamos tu tabla real llamada 'ventas'
      const queryText = `
         UPDATE ventas 
         SET estado = $1 
         WHERE id = $2 
         RETURNING *;
      `;
      const values = [estado, id];

      // 3. Ejecutar la consulta en la base de datos
      const result = await db.query(queryText, values);

      // 4. Si la consulta no afectó a ninguna fila, significa que el ID no existe
      if (result.rows.length === 0) {
         return res.status(404).json({ error: 'La venta/renta no existe.' });
      }

      // 5. Responder al frontend con éxito y pasar el registro modificado
      res.json({
         message: 'Estado actualizado con éxito',
         ventaActualizada: result.rows[0]
      });

   } catch (error) {
      console.error('Error al actualizar la base de datos:', error);
      res.status(500).json({ error: 'Error interno del servidor al actualizar el estado' });
   }
});

// Endpoint para eliminar una renta
app.delete('/api/rentas/:id', verificarToken, esAdmin, async (req, res) => {
   const { id } = req.params;
   try {
      const result = await db.query('DELETE FROM ventas WHERE id = $1 RETURNING *', [id]);  
      res.json({
         message: 'Renta eliminada con éxito',
         ventaEliminada: result.rows[0]
      });
   } catch (error) {
      console.error('Error al eliminar la renta:', error);
      res.status(500).json({ error: 'Error interno del servidor al eliminar la renta' });
   }
});

// Endpoint para traer las ventas por ID de producto
app.get('/api/ventas/:id', verificarToken, esAdmin, async (req, res) => {
   const { id } = req.params;
   try {
      const result = await db.query('SELECT * FROM ventas WHERE "productId" = $1 ORDER BY id ASC', [id]);
      res.json(result.rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener las ventas por ID' });
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