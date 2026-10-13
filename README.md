# Diario de Estudio

Web estática para registrar sesiones de estudio y motivarse viendo la racha de días
seguidos. Proyecto didáctico: el código está pensado para entenderlo alguien que empieza
a programar.

## Cómo abrirlo

Abre `index.html` con doble clic. No necesita servidor ni instalar nada: funciona desde
el navegador con `file://`.

## Qué hace

- Registra sesiones de estudio (fecha, tema y minutos).
- Muestra la **racha actual** de días consecutivos y la mejor racha conseguida.
- Resume los minutos de la semana y los días estudiados del mes.
- Pinta un **mapa de calor** de constancia con las últimas 12 semanas.
- Guarda todo en `localStorage` del navegador: tus sesiones no salen de tu máquina.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html` | Estructura de la página |
| `styles.css` | Estilos (variable y temas de paleta en `:root`) |
| `app.js` | Lógica y datos |
| `docs/` | Principios del proyecto (`constitution.md`) |
| `specs/` | Especificaciones por funcionalidad (spec activa y tareas) |
| `test/` | Pruebas de la lógica con `node --test` |

## Verificación

```sh
node --test
```

La lógica (fechas, rachas, estadísticas) está probada. El resto se comprueba a mano
abriendo `index.html`.