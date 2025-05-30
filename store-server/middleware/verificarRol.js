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
       