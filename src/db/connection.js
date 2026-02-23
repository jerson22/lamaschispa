const { Pool } = require('pg');
require('dotenv').config();

// Creamos una instancia del Pool para manejar múltiples conexiones de forma eficiente
const pool = new Pool({
   user: process.env.DB_USER,
   host: process.env.DB_HOST,
   database: process.env.DB_DATABASE,
   password: process.env.DB_PASSWORD,
   port: process.env.DB_PORT,
});

// Función para probar la conexión
pool.on('connect', () => {
   console.log('✅ Base de datos conectada correctamente');
});

pool.on('error', (err) => {
   console.error('❌ Error inesperado en el cliente de PostgreSQL', err);
   process.exit(-1);
});

module.exports = {
   query: (text, params) => pool.query(text, params),
   pool // Exportamos el pool por si se necesita para otras operaciones
};
