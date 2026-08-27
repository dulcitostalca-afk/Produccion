// Dulcitos — Control de visibilidad de porcentajes en fichas técnicas
// Solo Rosana y Eibar ven la columna "%". El resto del personal no.
// No requiere tocar el HTML de cada ficha: detecta la columna "%" sola.

(function () {
  const ADMINS = ['Rosana', 'Eibar'];

  function ocultarPorcentajes() {
    const usuario = localStorage.getItem('dulcitos_user');
    if (ADMINS.includes(usuario)) return; // admin: no se oculta nada

    document.querySelectorAll('table').forEach(function (table) {
      const filas = table.querySelectorAll('tr');
      if (!filas.length) return;

      const encabezado = Array.from(filas[0].children);
      const idx = encabezado.findIndex(function (celda) {
        return celda.textContent.trim() === '%';
      });
      if (idx === -1) return;

      filas.forEach(function (fila) {
        const celda = fila.children[idx];
        if (celda) celda.style.display = 'none';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ocultarPorcentajes);
  } else {
    ocultarPorcentajes();
  }
})();
