# Spec 001 — Mapa de calor de constancia

## Contexto y objetivo

- El Diario de Estudio registra sesiones y ya comunica la constancia a través de la racha, la mejor racha y el resumen semanal/mensual. Esas métricas muestran *cuánto llevas seguido*, pero ninguna ofrece una vista rápida de *cómo se reparte el estudio en el tiempo*: dónde hubo huecos, dónde se empujó más, qué semanas fueron ligeras.

- El mapa de calor (al estilo de la gráfica de contribuciones de GitHub) cubre esa ausencia: un vistazo de las últimas 12 semanas en el que cada día es una celda, y la intensidad de la celda indica cuántos minutos se estudió ese día. Es una forma rápida de verse la constancia en retrospectiva sin necesidad de leer la lista de sesiones.

- Objetivo: que el usuario, al mirar la página, perciba de un golpe de vista su regularidad de estudio en el último trimestre y detecte tendencias (semana débil, días seguidos, rachas).

## Usuarios

- Una sola persona: el estudiante que usa el diario. La consulta suele hacerse en móvil, en el mismo momento en que registra o revisa su racha. No necesita configuración ni datos históricos externos: el mapa se alimenta únicamente de las sesiones que ya guarda el diario.

## Historias de usuario

- Como estudiante, quiero ver de un vistazo mis últimas 12 semanas, para saber si estoy siendo constante sin tener que leer la lista de sesiones.
- Como estudiante que estudia varios días a distinta intensidad, quiero que el color de cada día refleje los minutos estudiados, para distinguir días ligeros de días intensos.
- Como estudiante curioso, quiero pasar el ratón (o tocar) un día y ver su fecha y minutos, para saber qué hubo ese día concreto.
- Como estudiante que acaba de empezar, quiero que el mapa se vea igual de bien con pocas o ninguna sesión, para que no parezca roto.

## Requisitos funcionales

### RF-1 — Mapa de las últimas 12 semanas

- CUANDO se muestra la página, ENTONCES se dibuja un mapa de calor con 12 columnas, una por semana natural, que termina en la semana en curso (la columna de la derecha).

**Criterios de aceptación:**
- CA-1.1: La cuadrícula tiene 12 columnas (una por semana) y 7 filas (lunes arriba, domingo abajo).
- CA-1.2: Las semanas empiezan en lunes (coherente con el resumen "Esta semana"): la columna de la izquierda arranca en un lunes.
- CA-1.3: El mapa representa solo los días desde el lunes de la semana de inicio (borde izquierdo, columna completa) hasta hoy. Los días posteriores a hoy de la semana en curso no se dibujan: la última columna queda parcial.
- CA-1.4: A 375 px de ancho las 12 columnas son visibles sin desplazamiento horizontal y las celdas mantienen un tamaño legible.

### RF-2 — Intensidad según minutos del día

- CUANDO una celda corresponde a un día con sesiones, ENTONCES su intensidad refleja la suma de minutos de ese día según uno de 4 estados visuales, donde el estado vacío (sin sesión) no cuenta como nivel.

- CUANDO la suma de minutos del día es de 1–29, ENTONCES la celda se pinta en el nivel más suave.

- CUANDO la suma de minutos del día es de 30–59, ENTONCES la celda se pinta en el nivel medio.

- CUANDO la suma de minutos del día es 60 o más, ENTONCES la celda se pinta en el nivel máximo.

- CUANDO un día tiene varias sesiones, ENTONCES los minutos se suman (mismo criterio que el total de la semana: ese día cuenta sus minutos acumulados, no si tuvo sesión o no).

**Criterios de aceptación:**
- CA-2.1: Una sesión de 35 min => nivel medio (al menos visualmente distinto de 15 min y de 80 min).
- CA-2.2: Dos sesiones de 25 y 20 min el mismo día => 45 min => nivel medio.
- CA-2.3: Existen exactamente 3 niveles de intensidad distinguibles entre sí y frente al estado vacío (los días con 29 min y con 30 min se distinguen; los de 30 y 60 no se confunden con el vacío).

### RF-3 — Días sin sesión

- CUANDO un día dentro del rango no tiene ninguna sesión, ENTONCES su celda se muestra vacía (estado por defecto, sin color de actividad) y sin información en el tooltip.

- CUANDO todas las celdas están vacías (sin ninguna sesión registrada), ENTONCES el mapa se muestra igualmente, íntegro y sin errores, como una hoja en blanco.

**Criterios de aceptación:**
- CA-3.1: El mapa no desaparece ni muestra mensajes de error si no hay sesiones.
- CA-3.2: Los días sin sesión se distinguen claramente del nivel más suave de actividad (CA-2.3).

### RF-4 — Información de cada día al pasar el ratón

- MIENTRAS el usuario mantiene el cursor sobre una celda con actividad, ENTONCES aparece una etiqueta con la fecha (en el mismo formato español que ya usa la app) y el total de minutos de ese día.

- CUANDO el usuario toca una celda con actividad en una pantalla táctil, ENTONCES se muestra la misma información.

- CUANDO la celda no tiene actividad, ENTONCES no se muestra información del día.

**Criterios de aceptación (RF-4):**
- CA-4.1: La fecha se muestra en español y con el mismo formato largo de fecha que ya usa la app en la lista ("jueves 14 de octubre") + minutos ("45 min"); no se mezclan formatos.
- CA-4.2: El tooltip no bloquea el flujo: aparece mientras se mantiene el cursor/tap, se oculta al salir de la celda, y no desplaza el resto del contenido ni necesita un clic para cerrarse.
- CA-4.3: En táctil y en escritorio se obtiene la misma información sin cambiar la estructura de la página.

### RF-5 — Ubicación y contenido

- CUANDO se pinta la página, ENTONCES el mapa se coloca al final, después de la lista de sesiones, como una sección propia del diario.

**Criterios de aceptación:**
- CA-5.1: Es la última sección de la página, visible sin necesidad de scroll adicional más allá del natural.
- CA-5.2: Tiene un título breve y descriptivo en español (p. ej. "Constancia — últimas 12 semanas"), coherente con el estilo de la app.

## Requisitos no funcionales

- RNF-1: **Sin dependencias ni build.** HTML/CSS/JS puros; funciona abriendo `index.html` con doble clic. (Rige del p.1 de la constitución.)
- RNF-2: **Lógica pura.** El cálculo de días y niveles es una función pura que recibe   "hoy" como parámetro (sin DOM, sin localStorage), testeable con `node --test` (p.3 y p.4 de la constitución).
- RNF-3: **Compatibilidad de datos.** No cambia el formato de `diario-estudio:sesiones`; no introduce claves nuevas: el mapa se deriva de las sesiones existentes.
- RNF-4: **Fechas locales.** Todo el cálculo usa la fecha local del usuario; nunca UTC. (Misma regla que ya rige las rachas y los resúmenes.)
- RNF-5: **Eficiencia.** El mapa se recalcula con los datos ya en memoria al pintar la página; no hay lecturas de almacenamiento por celda.
- RNF-6: **Visual coherente.** Usa las variables de color (`:root`) de `styles.css` (papel frío, tinta azul-gris y el resalte amarillo solo donde ya se usa, la racha); los tonos del mapa surgen de esos tokens, sin magia de color ni hex sueltos. La escala de intensidad es un degradado de la tinta sobre el papel, no un color nuevo.
- RNF-7: **Idioma.** Etiquetas, tooltips y títulos en español. Código en inglés (p.6 de la constitución).
- RNF-8: **Accesibilidad básica.** Las celdas llevan un atributo de texto descriptivo (fecha + minutos) para lectores de pantalla, además de la información visual.

## Casos límite

- Semana actual a medio: los días posteriores a hoy no se dibujan (RF-1 CA-1.3).
- Varias sesiones el mismo día: suman minutos (RF-2 CA-2.2).
- Cero sesiones: el mapa se pinta vacío sin errores (RF-3 CA-3.1).
- Cambio de año (p. ej. rango desde navidad hasta enero): solo afecta al borde izquierdo del mapa; el rango se calcula siempre como las 12 columnas semanales alineadas que terminan en la semana en curso.
- Sesión con pocos minutos (1 min) vs. sesión larga (por ejemplo 5 h): en ambos casos cuentan como días con actividad; la intensidad se determina por los umbrales de RF-2, no por un máximo predefinido (no hay cota superior: 5 h = nivel máximo, igual que 1 h).
- Fecha en el límite de la semana: el lunes pertenece a la columna de la semana que empieza ese lunes; no se duplica ni se solapa. La columna más a la izquierda es siempre una semana completa (lunes a domingo), nunca se corta a mitad.
- Sesiones con fecha futura heredadas (guardadas antes de aplicar el bloqueo de fechas): quedan fuera del rango (posteriores a hoy) y no se dibujan; no rompen el mapa ni se eliminan.

## Fuera de alcance

- Conectividad/backend: nada fuera del `file://` local.
- Personalización del rango (selector semanas/meses); el mapa es fijo a 12 semanas.
- Leyenda de niveles en pantalla no exigida (solo el tooltip); si se añade, será
  decisión de diseño posterior, anotada en dudas abiertas.
- Interacción tipo "clic y ver ficha del día" completa (solo tooltip hover/tap).
- Cambiar el formato de datos guardados.

## Criterios de finalización

1. El mapa aparece tras la lista de sesiones, con las 12 semanas terminando en la columna de la semana en curso y la semana empezando en lunes (RF-1).
2. Los 4 niveles de intensidad se distinguen visualmente y responden a los umbrales de minutos de RF-2.
3. El tooltip muestra fecha + minutos al hacer hover/tap solo en celdas con actividad (RF-4).
4. Sin sesiones, el bloque se ve correctamente vacío (RF-3).
5. La lógica de días/niveles está cubierta por tests de lógica pura (`node --test`), color verde; y la página se revisa con DevTools en consola limpia y vista móvil a 375 px.
6. `MEMORY.md` registra el estado de la funcionalidad.

## Dudas abiertas

- Ninguna: las tres ambigüedades previas quedan resueltas en el texto (tooltip en celdas sin actividad -> no se muestra; umbrales -> 1–29 / 30–59 / 60+; leyenda -> fuera de alcance).