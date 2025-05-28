const mysql = require('mysql2');

require('dotenv').config();

const db = mysql.createConnection({
   host: process.env.DB_HOST,
   user: process.env.DB_USER,   
   password: process.env.DB_PASSWORD,
   database: 'mi_tienda',
   multipleStatements: true 
});

/**
 * Registra una acción en la tabla de logs
 * @param {number} usuario_id - ID del usuario que realiza la acción
 * @param {string} accion - Acción realizada
 * @param {string} descripcion - Detalle adicional sobre la acción
 */
function registrarLog(usuario_id, accion, descripcion) {
    const sql = 'INSERT INTO logs (usuario_id, accion, descripcion) VALUES (?, ?, ?)';
    const valores = [usuario_id, accion, descripcion];

    db.execute(sql, valores, (err) => {
        if (err) {
            console.error('Error al registrar log:', err);
        } else {
            console.log(`Log registrado: [${accion}] - Usuario ID: ${usuario_id}`);
        }
    });
}

module.exports = registrarLog;