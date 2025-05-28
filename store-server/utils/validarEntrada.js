const validator = require("validator");

function escapeTexto(texto) {
  return validator.escape(texto.trim());
}

function validarUsuario(data) {
  const { nombre, usuario, contrasena, rol } = data;
  if (!nombre || !usuario || !contrasena || !rol) return false;

  return (
    validator.isLength(nombre, { min: 3 }) &&
    validator.isLength(usuario, { min: 3 }) &&
    validator.isLength(contrasena, { min: 6 }) &&
    ["administrador", "encargado", "vendedor"].includes(rol)
  );
}

function validarProducto(data) {
  const { nombre, descripcion, cantidad, precio } = data;
  if (!nombre || !descripcion || cantidad == null || precio == null)
    return false;

  return (
    validator.isLength(nombre, { min: 1 }) &&
    validator.isLength(descripcion, { min: 1 }) &&
    validator.isFloat(precio.toString()) &&
    validator.isInt(cantidad.toString(), { min: 0 })
  );
}

function validarCliente(data) {
  const { nombre, direccion, telefono, correo } = data;
  if (!nombre || !direccion || !telefono || !correo) return false;

  return (
    validator.isLength(nombre, { min: 3 }) &&
    validator.isMobilePhone(telefono, "es-MX") &&
    validator.isEmail(correo)
  );
}

module.exports = {
  escapeTexto,
  validarUsuario,
  validarProducto,
  validarCliente,
};
