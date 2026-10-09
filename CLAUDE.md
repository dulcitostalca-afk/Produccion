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

## REGLA: chequeo de recetas antes de publicar (desde el 2026-10-09)

**Ningún cambio de receta se publica si `node chequeo-recetas.mjs` no da todo igual.**

Cada ficha guarda la receta tres veces: la tabla "Ver receta base", el array de la
calculadora por unidades y `getRecetaBase()` de la calculadora por kilos. Nada las
mantiene iguales. El 2026-10-09 aparecieron dos fichas donde no coincidían:

- **Galletas de Huevo:** la calculadora por kilos seguía con la receta anterior (5 g de
  esencia) cuando la actual es 2,5 g de mantecado + 2,5 g de vainilla blanca.
- **Pan Golden:** 330/210/70 en una parte, contra 334/206/69 en otra.

El personal pesa con las calculadoras: si difieren de la tabla, se produce con una
receta que nadie decidió.

```
node chequeo-recetas.mjs                 # las 23 fichas
node chequeo-recetas.mjs ficha_x.html    # una sola
```

- **Bloquean** (código de salida 1): **gramos distintos** e **ingrediente que falta** en
  alguna de las tres partes.
- **Solo avisan** (marca `!`, no bloquean): **nombre distinto con los mismos gramos**.
  No cambian lo que se pesa, pero conviene unificarlos antes de migrar. Decidido por
  Eibar el 2026-10-09.
- Ignora a propósito la "Vista del panadero" y las variantes como la NY sin nueces, y lo
  dice en una nota.
- **No corrige nada.**

**Cada diferencia la confirma Eibar.** No hay regla automática del tipo "manda la
tabla": en Pan Golden mandó la tabla, pero eso no vale para las demás.

**La suma de la base no tiene que ser exactamente 1000 g.** Un aproximado es válido; no
se "corrige" la suma ni se reparte la diferencia.

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
