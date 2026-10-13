# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1.4 (rediseño visual con la skill `frontend-design`): misma funcionalidad que v1.3,
nueva identidad "cuaderno de estudio" (papel frío, reglas de separación, highlighter
amarillo solo en la racha, serif Georgia para títulos/datos). Toda la paleta está en las
variables `:root` de `styles.css`.
- **v1.5 (mapa de calor de constancia)**: sección «Constancia — últimas 12 semanas» al
final del documento. Funciones puras nuevas en `app.js`: `lunesDeSemana`,
`nivelDeIntensidad` y `construirMapa(sesiones, hoy)`. Pintado con `pintarMapa()` (12
columnas alineadas en lunes, 3 niveles de intensidad 1–29/30–59/60+ más vacío, días
futuros sin dibujar), tooltip propio por delegación de eventos (click y hover de ratón,
position `fixed` con clientX/clientY) y `aria-label` en cada celda.
- Datos en localStorage, sin cambio de formato: clave `diario-estudio:sesiones`.
- La fila "Mejor racha 🔥" va dentro del bloque de la racha y está oculta si no hay
sesiones. El resumen (minutos de la semana + días del mes) siempre visible.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha **derivada** de las sesiones, no guardada en una clave propia: cero
migración, y se recalcula sola si se registran días atrasados.
- "Esta semana" = semana natural de lunes a hoy (no últimos 7 días móviles): se ve un
reinicio claro el lunes y coincide con el habla común. Se eligió frente a la semana móvil.
- Total semanal **derivado** (suma de minutos, sin `Set`: ese día suma varias veces) y
mostrado siempre, incluso a 0, como recordatorio. Inicialmente fue tarjeta propia y se
fusionó con el mes en una sola "Resumen" para no acumular tarjetas.
- Días del mes **derivado y con `Set`** (días distintos, varias sesiones = 1): es el
matiz opuesto al total semanal; no "unificar" los dos cálculos por error. Rango del día 1
del mes a hoy, siempre visible ("0 días") y singular/plural automático.
- Rediseño (skill `frontend-design`): se eliminaron las tarjetas redondeadas con sombra y
el gradiente del hero (molde SaaS); ahora la página es "una hoja de cuaderno" con reglas,
el único acento llamativo es el highlighter de la racha, y el resto es papel y tinta
cuando no aporta nada más. El "número grande con etiqueta" se conserva a propósito: es el
punto de la app. La cabecera del título corrigió el `aria-labelledby` roto del bloque racha.
- Fechas futuras bloqueadas (`max` en el campo + validación en el `submit`): antes se
podían registrar, y eso dejaba la racha actual en 0 mientras entraba en el récord.
- Mapa de calor: `construirMapa` recibe `hoy` por parámetro (único `new Date()` real queda
en `pintarMapa`); rango = lunes −77 días; sesiones futuras heredadas fuera de rango se
ignoran (no se borran); tooltip en `fixed` con coordenadas del evento (más simple y sin
depender del layout de la sección; no desplaza el layout).
## Aprendizajes y errores a evitar
- `AGENTS.md` describía la clave y los campos con nombres distintos a los reales:
actualiza los docs hacia el código, nunca al revés (cambiar la clave destruye los datos
guardados).
- **`Set-Content` de PowerShell corrompe UTF-8** (convierte emojis/ñ en mojibake):
escribe y edita con las herramientas de archivo (Write/Edit), nunca con `Set-Content`.
- No hay suite de tests automática más allá de `node --test`: `test/mapa.test.js` carga
`app.js` con stubs de `document`/`localStorage` + `vm` y cubre las funciones puras del
mapa (7 tests en verde). Tener cuidado: los stubs solo recogen lo mínimo, si `app.js`
empieza a usar otra API de DOM en carga, hay que ampliarlos.
- Al citar funciones en `AGENTS.md` conviene comprobar el número de línea con grep: al
añadir código cambian y la referencia queda obsoleta (recuerda: una función se cita, no
se escribe su cuerpo).
## Próximos pasos
- Funcionalidad del mapa implementada y verificada: tasks.md T0–T10 ✅, `node --test`
verde (7 tests), Chrome headless con `--dump-dom`/CDP (recuento 12×7, sin scroll
horizontal a 375 px, niveles correctos, tooltip por click/hover). Revisar el render y el
tooltip con el MCP de Chrome DevTools si se quiere confirmación visual 1:1.
- Nada más planificado: próximas funcionalidades a decidir en la spec 002 si el usuario
las pide. Actualizar AGENTS.md si el mapa se convierte en regla permanente.
