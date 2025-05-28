const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const bcrypt = require("bcrypt");
const registrarLog = require("../store-server/log");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// Middleware de seguridad
app.use(helmet());

// Middleware general
app.use(cors());
app.use(bodyParser.json());

// Importa todas las funciones de validación y escape en una sola línea
const {
  validarCliente,
  validarProducto,
  validarUsuario,
  escapeTexto,
} = require("./utils/validarEntrada");

// Conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "mi_tienda",
  multipleStatements: true,
});

const verificarRol = require("./middleware/verificarRol");
const SECRET = process.env.JWT_SECRET;

// Ruta para registrar usuario - solo admin
app.post("/api/usuarios", verificarRol(["administrador"]), (req, res) => {
  const { nombre, usuario, contrasena, rol } = req.body;

  if (!validarUsuario(req.body)) {
    return res.status(400).json({ mensaje: "Datos inválidos" });
  }

  const nombreEscapado = escapeTexto(nombre);
  const usuarioEscapado = escapeTexto(usuario);
  const hash = bcrypt.hashSync(contrasena, 10);

  const sql =
    "INSERT INTO mi_tienda.usuarios (nombre, usuario, contrasena, rol) VALUES (?, ?, ?, ?)";
  db.execute(
    sql,
    [nombreEscapado, usuarioEscapado, hash, rol],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ mensaje: "El usuario ya existe" });
        }
        return res.status(500).json({ mensaje: "Error al registrar usuario" });
      }
      res.status(201).json({ mensaje: "Usuario registrado correctamente" });
    }
  );
});

// Obtener todos los usuarios - solo admin
app.get("/api/usuarios", verificarRol(["administrador"]), (req, res) => {
  const sql = "SELECT id, nombre, usuario, rol FROM mi_tienda.usuarios";
  db.execute(sql, (err, results) => {
    res.json(results);
  });
});

// Editar usuario - solo admin
app.put("/api/usuarios/:id", verificarRol(["administrador"]), (req, res) => {
  const { nombre, usuario, contrasena, rol } = req.body;
  if (!nombre || !usuario || !rol) {
    return res.status(400).json({ mensaje: "Faltan campos" });
  }

  let sql = "UPDATE mi_tienda.usuarios SET nombre = ?, usuario = ?, rol = ?";
  const params = [escapeTexto(nombre), escapeTexto(usuario), rol];

  if (contrasena) {
    const hash = bcrypt.hashSync(contrasena, 10);
    sql += ", contrasena = ?";
    params.push(hash);
  }

  sql += " WHERE id = ?";
  params.push(req.params.id);

  db.execute(sql, params, (err, result) => {
    if (err)
      return res.status(500).json({ mensaje: "Error al editar usuario" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({ mensaje: "Usuario actualizado" });
  });
});

// Eliminar usuario - solo admin
app.delete("/api/usuarios/:id", verificarRol(["administrador"]), (req, res) => {
  const sql = "DELETE FROM mi_tienda.usuarios WHERE id = ?";
  db.execute(sql, [req.params.id], (err, result) => {
    if (err)
      return res.status(500).json({ mensaje: "Error al eliminar usuario" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({ mensaje: "Usuario eliminado" });
  });
});

// Crear producto - solo admin y encargado
app.post(
  "/api/productos",
  verificarRol(["administrador", "encargado"]),
  (req, res) => {
    const { nombre, descripcion, cantidad, precio } = req.body;

    if (!validarProducto(req.body)) {
      return res.status(400).json({ mensaje: "Datos inválidos del producto" });
    }

    const nombreEsc = escapeTexto(nombre);
    const descripcionEsc = escapeTexto(descripcion);

    const sql =
      "INSERT INTO productos (nombre, descripcion, cantidad, precio) VALUES (?, ?, ?, ?)";
    db.execute(sql, [nombreEsc, descripcionEsc, cantidad, precio], (err) => {
      if (err)
        return res.status(500).json({ mensaje: "Error al agregar producto" });
      registrarLog(
        req.usuario.id,
        "Agregar producto",
        `Producto: ${nombreEsc}, Cantidad: ${cantidad}, Precio: ${precio}`
      );
      res.status(201).json({ mensaje: "Producto agregado correctamente" });
    });
  }
);

// Ver productos - todos los roles
app.get(
  "/api/productos",
  verificarRol(["administrador", "encargado", "vendedor"]),
  (req, res) => {
    db.execute("SELECT * FROM productos", (err, results) => {
      if (err)
        return res.status(500).json({ mensaje: "Error al obtener productos" });
      res.json(results);
    });
  }
);

// Editar producto - solo admin y encargado
app.put(
  "/api/productos/:id",
  verificarRol(["administrador", "encargado"]),
  (req, res) => {
    const { nombre, descripcion, cantidad, precio } = req.body;
    const sql =
      "UPDATE productos SET nombre = ?, descripcion = ?, cantidad = ?, precio = ? WHERE id = ?";
    db.execute(
      sql,
      [
        escapeTexto(nombre),
        escapeTexto(descripcion),
        cantidad,
        precio,
        req.params.id,
      ],
      (err) => {
        if (err)
          return res.status(500).json({ mensaje: "Error al editar producto" });
        registrarLog(
          req.usuario.id,
          "Editar producto",
          `Producto con ID ${req.params.id} modificado: ${nombre}, cantidad: ${cantidad}, precio: ${precio}`
        );
        res.json({ mensaje: "Producto actualizado" });
      }
    );
  }
);

// Eliminar producto - solo admin
app.delete(
  "/api/productos/:id",
  verificarRol(["administrador"]),
  (req, res) => {
    const sql = "DELETE FROM productos WHERE id = ?";
    db.execute(sql, [req.params.id], (err) => {
      if (err)
        return res.status(500).json({ mensaje: "Error al eliminar producto" });
      registrarLog(
        req.usuario.id,
        "Eliminar producto",
        `Producto eliminado con ID: ${req.params.id}`
      );
      res.json({ mensaje: "Producto eliminado" });
    });
  }
);

// Registrar cliente - solo admin
app.post("/api/clientes", verificarRol(["administrador"]), (req, res) => {
  const { nombre, direccion, telefono, correo } = req.body;

  if (!validarCliente(req.body)) {
    return res.status(400).json({ mensaje: "Datos de cliente inválidos" });
  }

  const sql =
    "INSERT INTO clientes (nombre, direccion, telefono, correo) VALUES (?, ?, ?, ?)";
  db.execute(
    sql,
    [
      escapeTexto(nombre),
      escapeTexto(direccion),
      escapeTexto(telefono),
      escapeTexto(correo),
    ],
    (err) => {
      if (err)
        return res.status(500).json({ mensaje: "Error al registrar cliente" });
      registrarLog(
        req.usuario.id,
        "Agregar cliente",
        `Cliente agregado: ${nombre} (${correo})`
      );
      res.status(201).json({ mensaje: "Cliente registrado correctamente" });
    }
  );
});

// Editar cliente - solo admin
app.put("/api/clientes/:id", verificarRol(["administrador"]), (req, res) => {
  const { nombre, direccion, telefono, correo } = req.body;
  const sql =
    "UPDATE clientes SET nombre = ?, direccion = ?, telefono = ?, correo = ? WHERE id = ?";
  db.execute(
    sql,
    [
      escapeTexto(nombre),
      escapeTexto(direccion),
      escapeTexto(telefono),
      escapeTexto(correo),
      req.params.id,
    ],
    (err) => {
      if (err)
        return res.status(500).json({ mensaje: "Error al editar cliente" });
      registrarLog(
        req.usuario.id,
        "Editar cliente",
        `Cliente editado con ID: ${req.params.id}`
      );
      res.json({ mensaje: "Cliente actualizado" });
    }
  );
});

// Eliminar cliente - solo admin
app.delete("/api/clientes/:id", verificarRol(["administrador"]), (req, res) => {
  const sql = "DELETE FROM clientes WHERE id = ?";
  db.execute(sql, [req.params.id], (err) => {
    if (err)
      return res.status(500).json({ mensaje: "Error al eliminar cliente" });
    registrarLog(
      req.usuario.id,
      "Eliminar cliente",
      `Cliente eliminado con ID: ${req.params.id}`
    );
    res.json({ mensaje: "Cliente eliminado" });
  });
});

// Ver clientes - admin y vendedor
app.get(
  "/api/clientes",
  verificarRol(["administrador", "encargado", "vendedor"]),
  (req, res) => {
    db.execute("SELECT * FROM clientes", (err, results) => {
      if (err)
        return res.status(500).json({ mensaje: "Error al obtener clientes" });
      res.json(results);
    });
  }
);

// Ruta para login
app.post("/api/login", async (req, res) => {
  const { usuario, contrasena, recaptchaToken } = req.body;

  const secretKey = "6Ld7VUwrAAAAACHLDetn7vwtUfA7oZGZirXcRCsL";
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;

  try {
    const recaptchaRes = await fetch(verifyUrl, { method: "POST" });
    const recaptchaData = await recaptchaRes.json();

    if (!recaptchaData.success) {
      return res.status(400).json({ mensaje: "reCAPTCHA inválido" });
    }

    const sql = "SELECT * FROM mi_tienda.usuarios WHERE usuario = ?";
    db.execute(sql, [usuario], (err, results) => {
      if (err)
        return res.status(500).json({ mensaje: "Error al iniciar sesión" });

      if (results.length === 0) {
        return res.status(401).json({ mensaje: "Credenciales incorrectas" });
      }

      const user = results[0];

      const storedHash = user.contrasena.trim();
      const match = bcrypt.compareSync(contrasena, storedHash);
      if (!match) {
        return res.status(401).json({ mensaje: "Credenciales incorrectas" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          usuario: user.usuario,
          rol: user.rol,
        },
        SECRET,
        { expiresIn: "1h" }
      );
      res.json({ token, usuario: user.usuario, rol: user.rol });
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al verificar reCAPTCHA" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
