// Dulcitos — Control de visibilidad de porcentajes en fichas técnicas
// Solo Rosana y Eibar ven la columna "%". El resto del personal no.
// No requiere tocar el HTML de cada ficha: detecta la columna "%" sola.

(function () {
  const ADMINS = ['Rosana', 'Eibar'];

  // Regla CSS para toda celda con clase .pct. Hace falta además de la búsqueda de
  // abajo por dos motivos: las calculadoras dibujan sus tablas DESPUÉS de cargar la
  // página (la búsqueda corre una sola vez y no las ve), y las tablas de cada tramo
  // no tienen fila de encabezado "%". Una regla CSS aplica también a lo que se
  // dibuje más tarde. Merma y rendimiento no llevan .pct y siguen visibles.
  // Esto es solo visual: los números siguen en el código de la página.
  if (!ADMINS.includes(localStorage.getItem('dulcitos_user'))) {
    const estilo = document.createElement('style');
    estilo.textContent = '.pct{display:none!important}';
    (document.head || document.documentElement).appendChild(estilo);
  }

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
