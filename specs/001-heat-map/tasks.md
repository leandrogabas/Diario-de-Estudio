# Tareas 001 — Mapa de calor de constancia

Derivadas de `spec.md` y `plan.md`. Orden de dependencia (una tarea solo empieza si las
anteriores están "Hecho cuando":). Cada tarea ≤ 20–30 min. Prohibido avanzar con
`node --test` en rojo (constitución p.4).

---

## Fase 0 — Preparación

### [ ] T0 — Confirmar archivo nuevo de tests
Cumple los límites de `AGENTS.md` (preguntar antes de crear archivos nuevos): se
necesita el visto bueno para crear `test/mapa.test.js` (directorio `test/`).
Cubre: RNF-2 (p.4 constitución).
**Hecho cuando:** el usuario confirma que se puede crear el directorio `test/` y el
archivo `test/mapa.test.js`.

### [x] T1 — Esqueleto de tests que carga `app.js`
Crear `test/mapa.test.js` con stubs mínimos de `document` (getElementById +
createElement devolviendo objetos no-op con `textContent`/`hidden`/`appendChild`/
`addEventListener`/`classList`) y de `localStorage` (`getItem` → `"[]"`), y cargar
`app.js` con `vm.runInThisContext` sin que pete. Un solo test de humo: "app.js se
carga sin error y define las funciones puras del mapa" (puede esperarlas `undefined`
todavía, solo que el fichero existe y el runner funciona).
Cubre: RNF-2, p.3/p.4.
**Hecho cuando:** `node --test` ejecuta `test/mapa.test.js` y termina en verde (el
estub no requiere la lógica aún).

---

## Fase 1 — Lógica pura (en `app.js`, con "hoy"/datos por parámetro)

### [x] T2 — `lunesDeSemana(fecha)`
Añadir en `app.js` la función pura que devuelve el lunes (Date local) de la semana
natural de `fecha`, con `offset = (fecha.getDay() + 6) % 7` y `new Date(año, mes,
día - offset)` (nada de UTC). Escribir sus 2 tests del plan (miércoles → lunes y
domingo → lunes) en `test/mapa.test.js`.
Cubre: RF-1 (CA-1.2), RNF-4.
**Hecho cuando:** `node --test` en verde para los 2 casos de `lunesDeSemana`.

### [x] T3 — `nivelDeIntensidad(minutos)`
Añadir la función pura con los umbrales: `>=60`→3, `>=30`→2, `>0`→1, resto→0.
Escribir los tests de umbrales (0,1,29,30,59,60,120 → 0,1,1,2,2,3,3) y el del total
45 → nivel 2.
Cubre: RF-2 (CA-2.1, CA-2.2, CA-2.3).
**Hecho cuando:** `node --test` en verde para umbrales y para el día acumulado de 45.

### [x] T4 — `construirMapa(sesiones, hoy): estructura`
Implementar la estructura base: `inicio = lunesDeSemana(hoy) − 77 días`, 12 columnas
de 7 celdas (lunes primero), celda `{fecha, minutos:0, nivel:0, futuro}` con
`futuro = fecha > fechaEnTexto(hoy)`, y `hoy`/`inicio` en texto. Testear: hoy
miércoles sin sesiones → 12 semanas, 84 celdas, `inicio` lunes, 4 celdas `futuro:
true` en la columna de la semana en curso (quedan lun–mié); columna izquierda
siempre completa no futura; hoy lunes → una sola celda no futura en la semana en
curso.
Cubre: RF-1 (CA-1.1, CA-1.2, CA-1.3), RF-3 (CA-3.1), RNF-4.
**Hecho cuando:** `node --test` en verde con los 3 casos de estructura de
`construirMapa`.

### [x] T5 — `construirMapa: minutos por día y casos límite`
Completar la agregación: `totalPorDia[s.fecha] += Number(s.minutos)||0` con
`fecha <= hoy` (excluye futuras heredadas), `minutos = totalPorDia[fecha]??0`,
`nivel = nivelDeIntensidad(minutos)`. Tests restantes del plan: suma 25+20=45→nivel
2; sin sesiones → todo `nivel:0` sin error; sesión futura heredada → fuera de rango;
cruce de año (hoy 2026-01-05 con sesión 2025-12-30) → dentro de la columna esperada;
minutos inválidos ("abc") → suma 0, `nivel:0`.
Cubre: RF-1 (caso límite semana/cruce), RF-2 (CA-2.2), RF-3 (CA-3.1), decisiones de
plan 6 y casos límite de spec (futuras heredadas), RNF-3, RNF-4, p.5.
**Hecho cuando:** `node --test` en verde con los 5 casos nuevos y, además, los tests
de las tareas anteriores siguen en verde.

---

## Fase 2 — Interfaz

### [x] T6 — Sección del mapa en `index.html`
Añadir al final de `<main>` (después del bloque «Sesiones`) la sección:
`<section class="bloque" aria-labelledby="titulo-constancia">` con
`<h2 class="bloque-titulo" id="titulo-constancia">Constancia — últimas 12 semanas</h2>`
y `<div class="mapa" id="mapa" role="img"></div>` (contenido 100% por JS).
Cubre: RF-5 (CA-5.1, CA-5.2), RNF-7.
**Hecho cuando:** abriendo `index.html`, la sección «Constancia» es la última del
documento y su `role` es `img`.

### [x] T7 — `pintarMapa()` y su integración en `pintar()`
En `app.js`: añadir la referencia `#mapa`, la función `pintarMapa()` que llama a
`construirMapa(sesiones, new Date())` (único `new Date()`), limpia `#mapa`, genera
una columna `.mapa-semana` por semana, omite celdas `futuro:true`, crea `.mapa-celda`
con clases `nivel-0..3` y `data-fecha`, y se invoca desde `pintar()` para que se
pinte al cargar y al guardar sesión.
Cubre: RF-1, RF-2, RF-3, RNF-5, RNF-7.
**Hecho cuando:** al abrir `index.html` con datos sembrados, el DOM de `#mapa` tiene
12 `.mapa-semana`, celdas con clases `nivel-*` correctas y sin celdas futuras.

### [x] T8 — Estilos responsive y de intensidad en `styles.css`
Añadir `.mapa` (flex, gap), `.mapa-semana` (grid, `flex:1`, `min-width:0`), `.mapa-
celda` (`aspect-ratio:1`, `background: var(--linea)`) y `.nivel-1/2/3` con
`background: var(--tinta)` y opacidades `.25/.55/.9`. Sin hex sueltos (RNF-6).
Cubre: RF-1 (CA-1.4), RF-3 (CA-3.2), RNF-6.
**Hecho cuando:** en Chrome DevTools a 375 px no hay scroll horizontal, las 12
columnas se ven y `nivel-0` se distingue de `nivel-1` y los 3 niveles entre sí.

### [x] T9 — Tooltip (hover/tap) + accesibilidad
Sobre `#mapa`: `pointerenter`/`pointerleave` y `click` delegados a `.mapa-celda`.
Mostrar tooltip (div única `.tooltip` en `position: fixed` sobre `clientX/clientY`)
con `fechaLegible(celda) + " — " + minutosLegibles(minutos)` solo en celdas
`nivel > 0`; ocultarlo con `mouseleave`, `pointerleave` o click fuera/segundo click
sin desplazar el layout. Celdas sin actividad: sin tooltip. `aria-label` en cada
celda (fecha + minutos, o "sin sesión").
Cubre: RF-4 (CA-4.1, CA-4.2, CA-4.3), RNF-8, RNF-7, RF-3 («sin información en el
tooltip»).
**Hecho cuando:** hover y tap muestran fecha+minutos solo en celdas con actividad, se
cierra solo al salir/tocar fuera, y las celdas vacías no muestran ningún tooltip;
`aria-label` presente en todas (verificable en DevTools).

---

## Fase 3 — Cierre QA

### [x] T10 — Tests completos + verificación visual y consola
`node --test` en verde. Con Chrome DevTools: datos sembrados (≥4 niveles distintos el
mismo día), revisar consola sin errores, vista móvil 375 px (CA-1.4), futuro vacío,
cero sesiones (bloque íntegro, RF-3). Actualizar `MEMORY.md` con el estado final y
marcar checkboxes de spec/plan.
Cubre: criterios de finalización de la spec (todos), p.4.
**Hecho cuando:** `node --test` verde, DevTools con consola limpia y 375 px correcto,
y `MEMORY.md` registra la funcionalidad (criterio 6 de la spec).