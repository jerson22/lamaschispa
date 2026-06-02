const db = require('./src/db/connection');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await db.query('BEGIN');

    // Crear usuario admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    await db.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      ['Admin', 'admin@example.com', hashedPassword, 'admin']
    );

    await db.query(`INSERT INTO clientes (id, nombre, telefono, email, direccion) VALUES
      (1, 'Ana Pérez', '555-1111', 'ana@ejemplo.com', 'Calle Luna 123'),
      (2, 'María López', '555-2222', 'maria@ejemplo.com', 'Avenida Sol 45'),
      (3, 'Laura Torres', '555-3333', 'laura@ejemplo.com', 'Plaza Estrella 9')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.query(`INSERT INTO productos (id, name, cantidad, precio_venta, precio_renta, descripcion, color, talla, vestido, silueta, mangas) VALUES
      (1, 'Vestido Rojo', 1, 3000, 500, 'Vestido elegante para graduaciones y eventos formales', 'rojo', 'M', B'1', 'a', 'tirantes'),
      (2, 'Aretes Dorados', 1, 600, 150, 'Aretes largos con brillo dorado', 'dorado', '', B'0', '', ''),
      (3, 'Zapatos Negros', 1, 1200, 250, 'Zapatos de tacón altos en color negro', 'negro', '37', B'0', '', ''),
      (4, 'Vestido Azul', 1, 3200, 600, 'Vestido azul con corte sirena para noche', 'azul', 'L', B'1', 'sirena', 'manga corta')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.query(`INSERT INTO reserva (id, clienteid, fechaevento, fechaentrega, fechadevolucion, estado, total, tipo) VALUES
      (1, 1, '2026-06-15', '2026-06-14', '2026-06-16', 'plancha', 650, 'renta'),
      (2, 2, '2026-06-20', '2026-06-19', '2026-06-21', 'pendiente_medidas', 850, 'renta'),
      (3, 1, '2026-06-10', '2026-06-09', '2026-06-11', 'devuelto', 750, 'renta')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.query(`INSERT INTO reservaitem (id, reservaid, productoid, cantidad, rol, estadoitem, preciounitario, notas) VALUES
      (1, 1, 1, 1, 'vestido', 'plancha', 500, 'Listo para entregar'),
      (2, 1, 2, 1, 'aretes', 'listo', 150, 'Juego completo'),
      (3, 2, 4, 1, 'vestido', 'medidas', 600, 'Ajustar cintura'),
      (4, 2, 3, 1, 'zapatos', 'pendiente', 250, 'Revisar suela'),
      (5, 3, 1, 1, 'vestido', 'devuelto', 500, 'Llegó en buen estado'),
      (6, 3, 3, 1, 'zapatos', 'devuelto', 250, 'Limpieza realizada')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.query(`INSERT INTO pago (id, reservaid, monto, fechapago, tipopago, metodo, notas) VALUES
      (1, 1, 300, '2026-06-01', 'anticipo', 'efectivo', '50% pagado'),
      (2, 1, 350, '2026-06-14', 'saldo', 'tarjeta', 'Pagado al recoger'),
      (3, 2, 200, '2026-06-05', 'anticipo', 'transferencia', 'A cuenta'),
      (4, 3, 750, '2026-06-05', 'pago_completo', 'efectivo', 'Pago total al momento de entrega')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.query(`SELECT setval(pg_get_serial_sequence('clientes', 'id'), COALESCE((SELECT MAX(id) FROM clientes), 1), true)`);
    await db.query(`SELECT setval(pg_get_serial_sequence('productos', 'id'), COALESCE((SELECT MAX(id) FROM productos), 1), true)`);
    await db.query(`SELECT setval(pg_get_serial_sequence('reserva', 'id'), COALESCE((SELECT MAX(id) FROM reserva), 1), true)`);
    await db.query(`SELECT setval(pg_get_serial_sequence('reservaitem', 'id'), COALESCE((SELECT MAX(id) FROM reservaitem), 1), true)`);
    await db.query(`SELECT setval(pg_get_serial_sequence('pago', 'id'), COALESCE((SELECT MAX(id) FROM pago), 1), true)`);

    await db.query('COMMIT');
    console.log('Seed completado correctamente.');
  } catch (error) {
    console.error('Error en seed:', error);
    await db.query('ROLLBACK');
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
