# AGENTS.md — Diario de Estudio
Web estática para registrar sesiones de estudio y motivarse viendo la racha de días
seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a
programar.
## Stack y estructura
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES (`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.
## Convenciones
- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.
- Identidad visual "cuaderno de estudio" (definida con la skill `frontend-design`, no cambiarla a la ligera): papel frío con reglas horizontales como separadores (sin tarjetas, sombras ni gradientes), tinta azul-gris, resalte amarillo como **único** acento (la racha), serif `Georgia` para lo que da carácter, resto en `system-ui`, todo alineado a la izquierda. Nada de etiquetas en MAYÚSCULAS ni enlaces con "→".
- Los tokens de color/medidas son las variables `:root` de `styles.css`; escribe pantallas nuevas con esas variables, no con hex sueltos.
## Datos
- localStorage, clave `diario-estudio:sesiones`: array de `{ fecha: "AAAA-MM-DD", tema: texto, minutos: número }`. Ver `app.js:1` y el `submit` si dudas: la forma real manda sobre este texto.
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario perderá sus sesiones. La "mejor racha" **no** cambia el formato: se deriva de las sesiones, no se guarda.
## Fechas y racha (fácil equivocarse)
- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni `new Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día. Usa los helpers de
`app.js:36-48` (`fechaEnTexto`, `fechaDesdeTexto`, `diaAnterior`).
- Racha = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión pero ayer sí, la racha sigue viva y se cuenta desde ayer (`calcularRacha`,
`app.js:73`).
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras están bloqueadas (`max` = hoy en el campo fecha, `app.js:269`, y validación en el `submit`): no las dejes pasar, rompen la racha actual y desalinean el récord.
- Mejor racha (`calcularMejorRacha`, `app.js:93`): se deriva de las fechas únicas ordenadas con `sort()` — válido solo con `AAAA-MM-DD` de anchura fija, porque el orden alfabético es el cronológico — y recorridas una vez: contador a 1 en cada hueco y `Math.max`. **No** aplica la regla de gracia, que solo afecta a la racha actual, así que la mejor nunca puede quedar por debajo de la actual. Si tocas un cálculo, revisa el otro.
- Minutos de la semana (`calcularMinutosSemana`, `app.js:135`): "esta semana" es de lunes (hora local, natural: `lunesDeEstaSemana`, `app.js:125`) a hoy, ambos incluidos. Suma de `minutos` comparando `fecha` como texto `AAAA-MM-DD` (`lunes <= fecha <= hoy`); aquí varias sesiones el mismo día **sí suman** (no hay `Set`). Se deriva de las sesiones, no se guarda. El rango acaba en hoy, así que una fecha futura heredada queda fuera.
- Días estudiados del mes (`calcularDiasEstudiadosMes`, `app.js:156`): "este mes" va del día 1 del mes actual (`primerDiaDelMes`, `app.js:151`, hora local) a hoy, ambos incluidos, comparando `fecha` como texto. Aquí **sí hay `Set`**: cuenta días distintos, no sesiones (varias sesiones el mismo día = 1), igual que la racha y al revés que el total semanal. 
Se deriva, no se guarda. El rango termina en hoy: fecha futura heredada queda fuera.
## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales). 

## Comandos
- Tests: `node --test`
## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código. 

## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea. 
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.
## Verificación
- - No hay tests automáticos. Después de cada cambio, verifica con el MCP de Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la vista móvil. 

- Para empezar de cero: DevTools → Application → Local Storage → borrar la clave `diario-estudio:sesiones`.
