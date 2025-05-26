// Verifica si el usuario tiene el rol adecuado para acceder a la ruta
/* function verificarRol(rolesPermitidos) {
    return (req, res, next) => {
        const rolUsuario = req.headers['rol']; // En producción usarías tokens
        if (!rolesPermitidos.includes(rolUsuario)) {
            return res.status(403).json({ mensaje: 'No tienes permiso para realizar esta acción' });
        }
        next();
    };
}

module.exports = verificarRol;
*/

/*
const jwt = require('jsonwebtoken');
const SECRET = 'Pskl3r0n';
*/

require('dotenv').config();

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET

function verificarRol(rolesPermitidos = []) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ mensaje: 'Token no proporcionado' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, SECRET);
            if (!rolesPermitidos.includes(decoded.rol)) {
                return res.status(403).json({ mensaje: 'Acceso denegado: rol insuficiente' });
            }

            req.usuario = decoded; // se puede usar después si lo necesitas
            next();
        } catch (error) {
            return res.status(401).json({ mensaje: 'Token inválido o expirado' });
        }
    };
}

module.exports = verificarRol;
       