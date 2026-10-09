// Chequeo de recetas: compara, en cada ficha, la tabla de "Ver receta base" con las
// dos calculadoras (por unidades/paquetes y por kilos).
//
// Por qué existe: cada ficha guarda la receta TRES veces (tabla HTML, array de la
// calculadora por unidades y getRecetaBase() de la calculadora por kilos) y nada las
// mantiene iguales. El 2026-10-09 aparecieron dos fichas donde no coincidían:
// Galletas de Huevo (la calculadora por kilos seguía con la receta anterior, 5 g de
// esencia, cuando la actual es 2,5 g de mantecado + 2,5 g de vainilla) y Pan Golden
// (330/210/70 contra 334/206/69). El personal pesa con las calculadoras: si difieren
// de la tabla, se produce con una receta que nadie decidió.
//
// REGLA (CLAUDE.md): ningún cambio de receta se publica si este chequeo no da todo
// igual. Cada diferencia la confirma Eibar; el chequeo no corrige nada.
//
// Uso:
//   node chequeo-recetas.mjs                  -> las 23 fichas
//   node chequeo-recetas.mjs ficha_x.html     -> una sola
// Sale con código 1 si alguna ficha tiene diferencias de gramos o ingredientes faltantes.
// Las diferencias de solo nombre (mismos gramos) son avisos y no bloquean.
//
// Cómo lee cada parte:
//   - Tabla: las filas con .d-nombre y .d-gramos FUERA de los <script>, en todas las
//     tablas de la ficha (en las fichas con tramos, la receta viene partida en varias).
//     Se excluye la "Vista del panadero" (repite parte de la receta con texto, como
//     "273 g total") y las filas TOTAL.
//   - Calculadoras: en vez de buscar los datos con expresiones regulares (cada ficha
//     los llama distinto: RBL, RG, Rgolden...), se EJECUTA el <script> de la ficha en un
//     entorno aislado (node:vm), sin navegador ni red, y se leen los datos reales:
//     todo array de objetos con {n, g} declarado en el script, y lo que devuelve
//     getRecetaBase().

import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const TOLERANCIA = 0.001;

// ---------------------------------------------------------------- utilidades

const sinEtiquetas = (html) =>
  html
    .replace(/<(span|div|small)[^>]*>[\s\S]*?<\/\1>/g, " ") // subtextos ("incluye la sal", nota del hielo)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// "0,4" -> 0.4 · "2.5" -> 2.5 · "1.000" (miles) -> 1000 · "265 (hielo...)" -> null
function aNumero(texto) {
  const t = texto.trim();
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ""));
  if (/^\d+([.,]\d+)?$/.test(t)) return Number(t.replace(",", "."));
  return null;
}

// Un objeto que acepta cualquier cosa: propiedades, llamadas, new. Hace de document,
// window, localStorage, etc. para que el script de la ficha corra sin navegador.
function comodin() {
  const f = function () {};
  return new Proxy(f, {
    get: (_, prop) => {
      if (prop === Symbol.toPrimitive) return () => "";
      if (prop === "length") return 0;
      if (prop === "value" || prop === "innerHTML" || prop === "textContent") return "";
      return comodin();
    },
    set: () => true,
    apply: () => comodin(),
    construct: () => comodin(),
  });
}

// ---------------------------------------------------------------- lectura

function leerTabla(html) {
  const sinScripts = html.replace(/<script[\s\S]*?<\/script>/g, "");
  const filas = [];
  const ignoradas = [];
  for (const t of sinScripts.matchAll(/<table[\s\S]*?<\/table>/g)) {
    // Acá sí se conserva el texto de los <div>: el título "Vista del panadero" va en uno.
    const antes = sinScripts
      .slice(Math.max(0, t.index - 300), t.index)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    const esVistaPanadero = /Vista del panadero/i.test(antes.slice(-120));
    for (const r of t[0].matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/g)) {
      if (/d-tot/.test(r[1])) continue;
      const nombre = r[2].match(/<td[^>]*class="[^"]*d-nombre[^"]*"[^>]*>([\s\S]*?)<\/td>/);
      const gramos = r[2].match(/<td[^>]*class="[^"]*d-gramos[^"]*"[^>]*>([\s\S]*?)<\/td>/);
      if (!nombre || !gramos) continue;
      const fila = { n: sinEtiquetas(nombre[1]), texto: sinEtiquetas(gramos[1]) };
      fila.g = aNumero(fila.texto);
      (esVistaPanadero ? ignoradas : filas).push(fila);
    }
  }
  return { filas, ignoradas };
}

function leerCalculadoras(html, archivo) {
  const codigo = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .join("\n;\n");

  // const/let no quedan como propiedades del contexto: se juntan los nombres de los
  // arrays declarados y se piden explícitamente al final.
  const nombres = [...codigo.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\[/g)].map((m) => m[1]);
  const lector = `;globalThis.__datos = { ${nombres
    .map((n) => `${JSON.stringify(n)}: (typeof ${n} !== "undefined" ? ${n} : undefined)`)
    .join(", ")} };
    globalThis.__base = (typeof getRecetaBase === "function") ? getRecetaBase() : undefined;`;

  const contexto = vm.createContext({
    document: comodin(),
    window: comodin(),
    localStorage: { getItem: () => "Eibar", setItem() {}, removeItem() {} },
    navigator: comodin(),
    location: comodin(),
    console: { log() {}, warn() {}, error() {} },
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval: () => 0,
    alert() {},
    fetch: () => Promise.resolve(comodin()),
  });
  try {
    vm.runInContext(codigo + lector, contexto, { timeout: 2000, filename: archivo });
  } catch (err) {
    return { error: `no se pudo ejecutar el script: ${err.message}` };
  }

  const esReceta = (v) =>
    Array.isArray(v) && v.length > 0 && v.every((x) => x && typeof x === "object" && "n" in x && "g" in x);
  const unidades = Object.entries(contexto.__datos ?? {})
    .filter(([, v]) => esReceta(v))
    .map(([nombre, v]) => ({ nombre, filas: v.map((x) => ({ n: String(x.n).trim(), g: Number(x.g) })) }));
  const kilos = esReceta(contexto.__base)
    ? contexto.__base.map((x) => ({ n: String(x.n).trim(), g: Number(x.g) }))
    : null;
  return { unidades, kilos };
}

// ---------------------------------------------------------------- comparación

// Empareja por nombre (con repetidos: el 2.º "Azúcar" con el 2.º "Azúcar").
function comparar(fuentes) {
  const claves = [];
  const porFuente = fuentes.map(({ filas }) => {
    const vistos = new Map();
    const m = new Map();
    for (const f of filas) {
      const i = (vistos.get(f.n) ?? 0) + 1;
      vistos.set(f.n, i);
      const clave = i > 1 ? `${f.n} (#${i})` : f.n;
      m.set(clave, f);
      if (!claves.includes(clave)) claves.push(clave);
    }
    return m;
  });
  const diferencias = [];
  const posicion = fuentes.map(({ filas }) => filas);
  for (const clave of claves) {
    const valores = porFuente.map((m) => m.get(clave));
    const nums = valores.map((v) => (v ? v.g : undefined));
    const falta = valores.some((v) => !v);
    const distinto =
      !falta && nums.some((x) => x === null || Number.isNaN(x) || Math.abs(x - nums[0]) > TOLERANCIA);
    if (falta || distinto) {
      diferencias.push({
        ingrediente: clave,
        tipo: falta ? "falta" : "gramos",
        valores: valores.map((v) => (v ? (v.g === null ? `"${v.texto}"` : String(v.g)) : "— falta —")),
      });
    }
  }
  // Las que "faltan" pero son el mismo ingrediente con otro nombre: misma posición en
  // cada lista y mismos gramos. Se informan aparte; igual cuentan como diferencia
  // (Eibar decide si se unifican los nombres).
  const nombres = [];
  const resto = diferencias.filter((d) => d.tipo !== "falta");
  const usadas = new Set();
  for (let i = 0; i < Math.max(...posicion.map((p) => p.length)); i++) {
    const filas = posicion.map((p) => p[i]);
    if (filas.some((f) => !f)) continue;
    const mismosGramos = filas.every((f) => f.g !== null && Math.abs(f.g - filas[0].g) <= TOLERANCIA);
    const mismosNombres = filas.every((f) => f.n === filas[0].n);
    if (mismosGramos && !mismosNombres) {
      nombres.push({ ingrediente: `#${i + 1}`, tipo: "nombre", valores: filas.map((f) => `"${f.n}"`) });
      filas.forEach((f) => usadas.add(f.n));
    }
  }
  const faltasReales = diferencias.filter(
    (d) => d.tipo === "falta" && !usadas.has(d.ingrediente.replace(/ \(#\d+\)$/, ""))
  );
  return [...resto, ...faltasReales, ...nombres];
}

// ---------------------------------------------------------------- main

const archivos = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(".").filter((f) => /^ficha_.*\.html$/.test(f)).sort();

let conDiferencias = 0;
let conAvisos = 0;
for (const archivo of archivos) {
  const html = readFileSync(archivo, "utf8");
  const tabla = leerTabla(html);
  const calc = leerCalculadoras(html, archivo);

  const fuentes = [];
  if (tabla.filas.length) fuentes.push({ etiqueta: "tabla", filas: tabla.filas });
  if (calc.error) {
    console.log(`\n✗ ${archivo}: ${calc.error}`);
    conDiferencias++;
    continue;
  }
  // La primera lista es la calculadora por unidades; las demás (variantes como la NY
  // sin nueces) se informan pero no se comparan: son recetas distintas a propósito.
  const [principal, ...otras] = calc.unidades;
  if (principal) fuentes.push({ etiqueta: `unidades (${principal.nombre})`, filas: principal.filas });
  if (calc.kilos) fuentes.push({ etiqueta: "kilos (getRecetaBase)", filas: calc.kilos });

  const notas = [];
  if (otras.length) notas.push(`no comparadas: ${otras.map((o) => `${o.nombre} (${o.filas.length} ingr.)`).join(", ")}`);
  if (tabla.ignoradas.length) notas.push(`"Vista del panadero" ignorada (${tabla.ignoradas.length} filas)`);
  const textos = tabla.filas.filter((f) => f.g === null);

  if (fuentes.length < 2) {
    console.log(`\n· ${archivo}: nada que comparar (${fuentes.map((f) => f.etiqueta).join(", ") || "sin receta"})`);
    continue;
  }

  // Solo BLOQUEAN gramos distintos e ingredientes faltantes. Un nombre distinto con los
  // mismos gramos es un AVISO (decidido por Eibar el 2026-10-09): no cambia lo que se
  // pesa, pero conviene unificarlo antes de migrar.
  const diferencias = comparar(fuentes);
  const bloqueantes = diferencias.filter((d) => d.tipo !== "nombre");
  const avisos = diferencias.filter((d) => d.tipo === "nombre");
  if (bloqueantes.length) conDiferencias++;
  if (avisos.length) conAvisos++;
  const marca = bloqueantes.length ? "✗" : avisos.length ? "!" : "✓";
  console.log(`\n${marca} ${archivo} — compara: ${fuentes.map((f) => `${f.etiqueta} [${f.filas.length}]`).join(" · ")}`);
  for (const n of notas) console.log(`    nota: ${n}`);
  if (textos.length) console.log(`    nota: celdas de gramos con texto: ${textos.map((t) => `${t.n} = "${t.texto}"`).join("; ")}`);
  const titulo = { gramos: "GRAMOS DISTINTOS", falta: "FALTA EN ALGUNA", nombre: "aviso: solo nombre distinto (mismos gramos)" };
  for (const d of [...bloqueantes, ...avisos]) {
    console.log(`    [${titulo[d.tipo]}] ${d.ingrediente}: ${d.valores.map((v, i) => `${fuentes[i].etiqueta.split(" ")[0]} ${v}`).join(" | ")}`);
  }
}

console.log(
  `\n${archivos.length} fichas · ${conDiferencias} con diferencias que bloquean · ${conAvisos} solo con avisos de nombre`
);
process.exit(conDiferencias ? 1 : 0);
