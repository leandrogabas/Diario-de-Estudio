# Plan 001 — Mapa de calor de constancia

Cubre la spec activa `specs/001-heat-map/spec.md`. Respeta la constitución
(`docs/constitution.md`) y la estructura real de `index.html`, `styles.css` y `app.js`.
Todas las decisiones quedan justificadas con su alternativa descartada.

---

## 1. Archivos: qué se crea y qué se modifica

| Archivo | Acción | Responsabilidad | RF/CA que cubre |
|---|---|---|---|
| `index.html` | **Modificar** | Añadir la sección "Constancia — últimas 12 semanas" como última sección, tras el bloque de «Sesiones». Contiene solo el título y un contenedor vacío para las celdas; el contenido se genera con JS. Un único marcado estático, sin botones ni celdas en HTML. | RF-5 (CA-5.1, CA-5.2) |
| `styles.css` | **Modificar** | Layout responsive de la cuadrícula (12 columnas × 7 filas, sin scroll horizontal a 375 px) + los 3 niveles de intensidad + el tooltip. Todos los colores salen de tokens `:root`; la escala de intensidad es la tinta sobre el papel. | RF-1 (CA-1.4), RF-2, RF-3 (CA-3.2), RNF-6 |
| `app.js` | **Modificar** | Lógica pura (`lunesDeSemana`, `nivelDeIntensidad`, `construirMapa`) + pintado (`pintarMapa`) + tooltip (delegación de eventos). Se añade `pintarMapa()` a la función `pintar()` existente. No cambia el formato de `diario-estudio:sesiones`. | RF-1, RF-2, RF-3, RF-4, RNF-2, RNF-3, RNF-5, RNF-7, RNF-8 |
| `test/mapa.test.js` | **Crear** (nuevo) | Tests de lógica pura con `node --test` que cargan `app.js` con `document`/`localStorage` simulados (el propio `app.js` no se puede importar en Node sin ellos). | RNF-2, p.3 y p.4 de la constitución, todos los CA |

> ⚠️ Según los límites de `AGENTS.md` hay que **preguntar antes de crear archivos nuevos**: la creación de `test/mapa.test.js` (directorio `test/`) requiere confirmación antes de implementar. El directorio `test/` se elige porque `node --test` sin argumentos lo descubre automáticamente (igual que los patrones `*.test.js`); así el comando de la constitución no cambia.

No se crea HTML/CSS/JS de la app nuevo ni se añade ninguna dependencia; tampoco `fetch`, módulos ES ni nada que requiera servidor (RNF-1, p.1).

---

## 2. Funciones puras de lógica (todas reciben "hoy" como parámetro)

Nuevas en `app.js`, siguiendo el patrón de `calcularRacha`/`calcularMinutosSemana` pero **puras de verdad** (sin leer `sesiones` global ni llamar a `new Date()` internamente): la entrada llega por parámetro. Se respeta p.3.

| Función | Firma | Salida | Cubre |
|---|---|---|---|
| `lunesDeSemana(fecha)` | `fecha: Date local` → `Date local` | El lunes de la semana natural que contiene `fecha`. | RF-1 (CA-1.2) |
| `nivelDeIntensidad(minutos)` | `minutos: number` → `number` | `0` si no hay sesión (≤0), `1` de 1–29, `2` de 30–59, `3` si ≥60. | RF-2 (CA-2.1, CA-2.2, CA-2.3) |
| `construirMapa(sesiones, hoy)` | `sesiones: array`, `hoy: Date local` → objeto mapa | Una sola pasada: agrega minutos por día, filtra fechas futuras, genera las 12 columnas y anota nivel y "futuro" por celda. | RF-1, RF-2, RF-3, casos límite |

Formato de `construirMapa` (decisión de este plan):

```
{
  inicio: "AAAA-MM-DD",           // lunes de la columna izquierda
  hoy: "AAAA-MM-DD",
  semanas: [
    {
      lunes: "AAAA-MM-DD",        // doc.: lunes de la columna
      celdas: [ {
        fecha: "AAAA-MM-DD",      // lunes primero, domingo último
        minutos: number,          // suma acumulada del día (0 si no hubo)
        nivel: 0|1|2|3,
        futuro: boolean           // true solo en la columna de la semana en curso, para días posteriores a hoy
      } ]                         // siempre 7 celdas (la celda "futura" se omite al pintar, no al calcular)
    }                             // 12 semanas → 84 celdas
  ]
}
```

Razones del formato: devuelve **todos** los días calcados (84) y marca `futuro` en vez de podar la lista, porque el pintado necesita saber qué omitir y porque eso se puede verificar en tests sin tocar el DOM. `minutos` se acumula antes del ítem `nivel` para que el tooltip (RF-4) tenga un solo origen de datos. Fecha de cada celda como texto `AAAA-MM-DD` para comparar por orden alfabético (anchura fija), igual que ya hace el resto de la app.

No se guarda nada nuevo (RNF-3): el mapa se deriva al pintar de `sesiones`.

---

## 3. Algoritmo del mapa (pseudocódigo)

```text
FUNCIÓN lunesDeSemana(fecha):            // Date local → Date local
  # En JS Date.getDay(): 0=domingo...6=sábado.
  # Días a retroceder para llegar al lunes:
  offset = (fecha.getDay() + 6) % 7
  devolver new Date(fecha.año, fecha.mes, fecha.día - offset)

FUNCIÓN nivelDeIntensidad(min):
  si min >= 60: devolver 3
  si min >= 30: devolver 2
  si min >  0:  devolver 1
  devolver 0                              # día sin estudio / minutos 0

FUNCIÓN construirMapa(sesiones, hoy):     # hoy: Date local; sin DOM ni storage
  hoyTexto = fechaEnTexto(hoy)

  # 1) Total de minutos por día, excluyendo fechas futuras (heredadas).
  totalPorDia = {}
  para cada s en sesiones:
    si s.fecha <= hoyTexto:               # futuro heredado -> fuera del rango (no se borra)
      totalPorDia[s.fecha] =
        (totalPorDia[s.fecha] ?? 0) + (Number(s.minutos) || 0)

  # 2) Borde izquierdo: lunes de la semana en curso − 11 semanas.
  #    → exactamente 12 columnas alineadas, la izquierda siempre es lunes (nunca se corta).
  inicio = lunesDeSemana(hoy)
  retroceder 77 días                      # 11 semanas * 7
  inicio es el lunes de la columna 0

  semanas = []
  para w = 0..11:                         # 12 columnas
    lunesDeColumna = inicio + w*7 días
    celdas = []
    para d = 0..6:                        # 7 días, lunes primero -> RF-1 CA-1.1
      fecha  = fechaEnTexto(lunesDeColumna + d días)   # todo local, nada de UTC
      futuro = fecha > hoyTexto
      min    = totalPorDia[fecha] ?? 0
      celdas.append { fecha, minutos: min, nivel: nivelDeIntensidad(min), futuro }
    semanas.append { lunes: fechaEnTexto(lunesDeColumna), celdas }

  devolver { inicio: fechaEnTexto(inicio), hoy: hoyTexto, semanas }
```

Notas de algoritmo:
- **Fechas locales**: todas las operaciones usan `new Date(año, mes, día)` y text-fecha `AAAA-MM-DD`; jamás `toISOString()` ni `new Date("AAAA-MM-DD")` (RNF-4). `fechaEnTexto`/`fechaDesdeTexto` ya existentes son reutilizables.
- **Semana desde lunes**: la columna de la derecha es la semana en curso (contiene `hoy`); `futuro` solo puede ser `true` en esa columna, porque el rango acaba en hoy.
- **Año nuevo**: no hay lógica especial; el rango se recorre desde `inicio` sin mirar meses/años (caso límite "navidad → enero" sale gratis).
- **Sesión de hoy sin sesión**: queda como `nivel: 0`, igual que cualquier día pasado sin estudio (decisión QA: hoy no tiene trato especial).
- **Sesiones con `minutos` inválidos/ausentes** (solo datos heredados, el formulario exige ≥1): contribuyen 0 y el día puede quedar en `nivel: 0`; no se estropean y se mantiene el criterio `Number(x)||0` que ya usa `calcularMinutosSemana`.

---

## 4. Pintado en la interfaz

**`index.html` (RF-5)** — nueva sección final, tras «Sesiones»:

```html
<section class="bloque" aria-labelledby="titulo-constancia">
  <h2 class="bloque-titulo" id="titulo-constancia">Constancia — últimas 12 semanas</h2>
  <div class="mapa" id="mapa" role="img"></div>
</section>
```

**`ejemplos`: `pintarMapa()` en `app.js`** (llamada desde `pintar()`, que ya se invoca al cargar y al guardar):

```text
FUNCIÓN pintarMapa():
  mapa = construirMapa(sesiones, new Date())    # único punto con "hoy" real
  vaciar contenedor #mapa
  para cada semana en mapa.semanas:
    columna = <div class="mapa-semana">        # una columna por semana (RF-1)
    para cada c < semana.celdas:
      si c.futuro:  seguir                      # los días posteriores a hoy NO se dibujan (RF-1 CA-1.3)
      celda = <div class="mapa-celda" data-fecha="c.fecha">
      celda.classList += "nivel-" + c.nivel     # nivel-0 (vacío), 1, 2, 3 (RF-2, RF-3)
      si c.nivel > 0:
        celda.aria-label = fechaLegible(c.fecha) + " — " + minutosLegibles(c.minutos)   # RNF-8
        # el texto usa fechaLegible/minutosLegibles EXISTENTES (mismo formato que la lista, CA-4.1)
      sino:
        celda.aria-label = fechaLegible(c.fecha) + " — sin sesión"                       # RNF-8
      columna.append(celda)
    #mapa.append(columna)
```

La cuadrícula se arma con **columnas flex** (cada `<div class="mapa-semana">` una columna de 7 celdas con `aspect-ratio: 1`), de modo que el orden de lectura de la especificación es natural por filas y por columnas sin `grid` complejo. Las celdas "futuras" no existen en el DOM: así "día por venir" y "día pasado sin estudiar" no se confunden (decisión QA).

**Tooltip (RF-4)** — una única `<div class="tooltip">` absoluta dentro de la sección (que pasa a `position: relative`), manejada por **delegación de eventos** en el contenedor `#mapa` (los nodos se recrean en cada pintado, no vale bindearlos uno a uno).

```text
eventos sobre #mapa:
  mouseover  sobre .mapa-celda con .nivel-1/2/3  -> mostrar tooltip (fechaLegible + minutosLegibles) cerca de la celda
  mouseleave -> ocultar tooltip
  click      sobre .mapa-celda                    -> táctil y ratón: mostrar tooltip; un segundo click (o click en cualquier
                                                      otro sitio, o mouseleave) lo oculta (CA-4.2)
  click      sobre .mapa-celda.nivel-0            -> nada (RF-4: sin actividad = sin información)
```

Cierre automático garantizado: `mouseleave` / click fuera / segundo click; nunca requiere "clic de cierre" separado; no desplaza el layout porque es `position: absolute` (CA-4.2). En táctil el `click` dispara una vez por tap (CA-4.3). La información no está solo en el tooltip: cada celda lleva `aria-label` (RNF-8), así los lectores de pantalla no dependen de él.

**`styles.css`** — añadir al final:

```css
.mapa      { display: flex; gap: 4px; }
.mapa-semana { display: grid; flex: 1; min-width: 0; gap: 4px; }   /* 7 filas / columna */
.mapa-celda { aspect-ratio: 1; background: var(--linea); }         /* vacío distinguible de nivel-1 */
.mapa-celda.nivel-1 { background: var(--tinta); opacity: .25; }
.mapa-celda.nivel-2 { background: var(--tinta); opacity: .55; }
.mapa-celda.nivel-3 { background: var(--tinta); opacity: .9;  }
.tooltip { position: absolute; left: 0; top: 100%; /* oculto por defecto */ }
```

- **Responsive a 375 px** (CA-1.4): `flex: 1` + `min-width: 0` + celdas cuadradas reparten las 12 columnas sin overflow → sin scroll horizontal.
- **Tokens, sin hex sueltos** (RNF-6): la escala es la tinta (`--tinta`) con distinta opacidad sobre el papel (`--papel`); el vacío es la línea (`--linea`). Se distingue claramente `nivel-0` de `nivel-1` (CA-3.2). El highlighter amarillo sigue siendo solo para la racha.

---

## 5. Decisiones técnicas justificadas (y alternativas descartadas)

1. **Rango = 12 columnas semanales alineadas, no "últimos 84 días móviles".**
   `construirMapa` calcula `lunesDeSemana(hoy) − 11 semanas` y recorre 84 celdas. La columna izquierda siempre es lunes y completa (caso límite de la spec).
   *Descartada*: 84 días rodantes hacia atrás — deja el borde izquierdo a mitad de semana, contradice CA-1.2 y duplica el caso límite de columna cortada.
2. **Celdas futuras omitidas del DOM, no pintadas como "vacío".**
   Evita que el usuario lea el martes/miércoles no alcanzados como "no estudiados" (decisión de la QA previa). El campo `futuro` se calcula de todos modos (testeas en lógica pura).
   *Descartada*: dibujarlas con el color del día sin sesión — además de confundir, habría que inventar un estado "futuro" que la spec no define.
3. **Tooltip propio, no atributo `title` nativo.**
   `title` no responde de forma fiable al tap en móviles y fuerza el retraso del navegador; RF-4 exige tap + cierre automático. Con una única `<div>` posicionada y delegación de eventos se cumple CA-4.2 y CA-4.3 sin añadir bibliotecas.
   *Descartada*: `title` nativo (falla táctil) y un tooltip por celda creado en cada `pintarMapa` (nodos huérfanos que limpiar).
4. **`construirMapa` devuelve 84 celdas "futuro incluidas" y filtra el pintado → incluye "futuras" solo en la semana en curso.**
   La lógica pura sabe hoy, la vista decide qué omitir. Permite probar la columna parcial sin DOM.
   *Descartada*: devolver el mapa ya podado — pierdes la columna parcial en el test y duplicas la regla en dos sitios.
5. **Reutilizar `fechaLegible` y `minutosLegibles` para el tooltip.**
   CA-4.1 pide "el mismo formato que ya usa la app en la lista": se reutilizan tal cual (aunque incluyan el año), en vez de crear un formato nuevo que incumpliría "no mezclar formatos".
   *Descartada*: un formato de tooltip a medida ("jueves 14 de octubre") — dos formatos de fecha en la misma pantalla, contra CA-4.1.
6. **Sesiones con `minutos` inválidos contribuyen 0.**
   Mismo criterio `Number(x)||0` de `calcularMinutosSemana`; los datos no se corrigen ni se pierden (p.5). Un día cuyo total es 0 queda en `nivel: 0` (invisible), nunca fabrica nivel.
   *Descartada*: promover a `nivel: 1` cualquier día con sesión — inventa un criterio que la spec no fija.
7. **Tests en `node --test` cargando `app.js` con stubs, no extraer la lógica a un módulo nuevo.**
   `app.js` no se puede `require` en Node (usa `document`/`localStorage` en el piso superior). Opción A (elegida): un `test/mapa.test.js` que define stubs mínimos (`getElementById` devuelve objetos con `textContent/hidden/appendChild/addEventListener` no-op, `localStorage.getItem` → `"[]"`) y ejecuta `app.js` con `vm`, para luego llamar a las funciones puras. Opción B: extraer la lógica a otro archivo JS — lo descartamos porque añade un archivo de app y un `<script>` más (RNF-1 / simplicidad, y AGENTS "no añadir por tu cuenta").
   *Descartada*: no probar nada (prohibido, p.4) o reescribir `app.js` como módulo (rompe `file://`).
8. **Sin clave nueva en localStorage.** El mapa se deriva de la misma `diario-estudio:sesiones` (RNF-3, p.5). Cero migración.

---

## 6. Estrategia de tests (`node --test`)

Fichero nuevo: `test/mapa.test.js`. Setup: stubs de `document` y `localStorage` + `vm` para cargar `app.js` una vez; los tests llaman solo a las funciones puras (sin DOM, p.3). El comando de la constitución (`node --test`) lo detecta solo.

| Caso de prueba | Entrada | Salida esperada | Cubre |
|---|---|---|---|
| `lunesDeSemana` para hoy miércoles | `new Date(2026, 6, 15)` (mie) | el lunes `new Date(2026, 6, 13)` | RF-1 CA-1.2 |
| `lunesDeSemana` para hoy domingo | `new Date(2026, 6, 19)` | el lunes `new Date(2026, 6, 13)` | RF-1 CA-1.2 |
| `nivelDeIntensidad` umbrales | 0, 1, 29, 30, 59, 60, 120 | 0, 1, 1, 2, 2, 3, 3 | RF-2 CA-2.1/CA-2.3 |
| `nivelDeIntensidad` días con varias sesiones | acumulado 45 | nivel 2 | RF-2 CA-2.2 |
| `construirMapa` hoy miércoles | hoy miércoles, sin sesiones | 12 semanas; 84 celdas; `inicio` es lunes; columna de la semana en curso tiene 2 celdas `futuro:true` (jue+vie+sáb+dom=4 futuras, quedando lun–mié) | RF-1 CA-1.1/CA-1.3, RF-3 CA-3.1 |
| `construirMapa` columna izquierda | cualquiera | `inicio` siempre lunes; 7 celdas no futuras en columna 0 | RF-1 CA-1.2/CA-1.3 |
| `construirMapa` suma por día | 2 sesiones (25+20) el mismo día | 1 celda con `minutos:45`, `nivel:2` | RF-2 CA-2.2 |
| `construirMapa` sin sesiones | `[]` | todas `nivel:0`; no tira error; estructura íntegra | RF-3 CA-3.1 |
| `construirMapa` sesión futura heredada | sesión con fecha `> hoy` | fuera de rango: no aparece ninguna celda con esa fecha | caso límite (spec) |
| `construirMapa` cruce de año | hoy = 2026-01-05, sesión en 2025-12-30 | la celda 2025-12-30 está dentro de la columna correcta | caso límite (spec) |
| `construirMapa` minutos inválidos | sesión con `minutos: "abc"` | suma 0; día en `nivel:0` | decisión plan (6) |
| `construirMapa` hoy lunes | hoy lunes, sin sesiones | solo 1 celda no futura en la columna de la semana en curso | RF-1 CA-1.3 |

Reglas de la constitución que aplican al pasar a implementar:
- **p.4 / puerta de tests**: `node --test` en verde es condición para seguir; no se avanza con rojos.
- **p.2 / la spec manda**: todo lo de arriba ya está mapeado a RF/CA; si al implementar surge una decisión nueva que la spec no cubre, se para y se pregunta (no se improvisa).
- **p.5**: los stubs, tests y cambios de `pintar()` jamás modifican ni re-emiten `diario-estudio:sesiones`.

Cierre por QA del desarrollo (criterios de finalización de la spec): revisión con Chrome DevTools de consola limpia y vista móvil a 375 px (CA-1.4), y actualización de `MEMORY.md`.