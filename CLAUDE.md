# Dulcitos — Fichas técnicas (Produccion)

## Qué es

Fichas técnicas estáticas de Dulcitos Talca (recetas con calculadora de escalado),
publicadas en GitHub Pages: https://dulcitostalca-afk.github.io/Produccion/ — cada
ficha es un `.html` en la raíz, sin build. Pages publica `main` tal cual: **sin push
no cambia nada en la página.**

**Es temporal.** Las fichas se migran todas juntas al sistema (`/fichas/`, recetas
versionadas en D1, repo `dulcitos-sistema`, submódulo `recetas`). Al migrar se
despublica Pages y este repo queda privado. Hasta entonces, las recetas nuevas se
siguen cargando acá.

## Convenciones

- **CSS embebido por archivo.** Cada ficha lleva su propio `<style>` y no enlaza hojas
  externas. `dulcitos.css` existe, pero solo lo usan `index.html`,
  `control_neveras.html` y `produccion_diaria.html`; ninguna ficha lo enlaza. Un cambio
  de estilo en las fichas se pega archivo por archivo.
- **Los nombres de archivo de las fichas nunca cambian.** El personal las abre por URL
  desde el celular y el índice las enlaza por nombre: renombrar rompe el acceso.
- **`node --check` antes de entregar.** Sobre `dulcitos-permisos.js` y sobre el
  `<script>` de cada ficha que se tocó (extraerlo a un `.js` temporal para chequearlo).

## Permisos

Se aplican en `dulcitos-permisos.js`. El porcentaje base de la fórmula (celdas `.pct`)
solo lo ven Eibar y Rosana; producción ve solo los gramos de la tanda.

**El ocultamiento es solo visual.** El sitio es público y los números están en el
código de cada página: cualquiera que abra el código fuente los ve. La privacidad real
llega con la migración a D1.

## Legibilidad en celular

Nombre del ingrediente y gramos en **22px negrita** (`.d-nombre`, `.d-gramos`); el `%`
en **12px peso normal**. En la fila TOTAL solo se agranda el número.

La receta se dibuja en tres lugares por ficha (tabla estática, calculadora por unidades
y calculadora por kilos): las clases tienen que estar en los tres.

## Productos con varios nombres

Berlín, Rosca, Pavita y Bomba son el mismo producto. La ficha es
`ficha_berlin_rosca.html`.

## Checklist de cierre de sesión

Es el mismo que el de `dulcitos-sistema`: ver la sección "Checklist de cierre de
sesión" en su CLAUDE.md
(`C:\Users\Lenovo\Documents\Sistema Inventario\dulcitos-sistema\CLAUDE.md`, o
https://github.com/dulcitostalca-afk/dulcitos-sistema/blob/main/CLAUDE.md). La lista
maestra y PENDIENTES-PRODUCCION.md viven en ese repo, no en este.
