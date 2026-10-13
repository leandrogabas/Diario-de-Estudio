const CLAVE_ALMACEN = "diario-estudio:sesiones";

const formulario = document.getElementById("formulario");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const cajaError = document.getElementById("error");
const listaSesiones = document.getElementById("sesiones");
const textoVacio = document.getElementById("vacio");
const numeroRacha = document.getElementById("racha-dias");
const textoRacha = document.getElementById("racha-texto");
const filaMejor = document.getElementById("fila-mejor");
const numeroMejor = document.getElementById("mejor-dias");
const textoTotalSemana = document.getElementById("minutos-semana");
const textoDiasMes = document.getElementById("dias-mes");
const contenedorMapa = document.getElementById("mapa");
const tooltip = document.getElementById("tooltip");

let sesiones = leerSesiones();

function leerSesiones() {
  const datos = localStorage.getItem(CLAVE_ALMACEN);
  if (!datos) {
    return [];
  }
  try {
    const lista = JSON.parse(datos);
    return Array.isArray(lista) ? lista : [];
  } catch (error) {
    return [];
  }
}

function guardarSesiones() {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(sesiones));
}

function fechaEnTexto(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

function fechaDesdeTexto(texto) {
  const partes = texto.split("-").map(Number);
  return new Date(partes[0], partes[1] - 1, partes[2]);
}

function diaAnterior(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - 1);
}

function fechaLegible(texto) {
  return fechaDesdeTexto(texto).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function minutosLegibles(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) {
    return resto + " min";
  }
  if (resto === 0) {
    return horas + " h";
  }
  return horas + " h " + resto + " min";
}

function lunesDeSemana(fecha) {
  const offset = (fecha.getDay() + 6) % 7;
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - offset);
}

function nivelDeIntensidad(minutos) {
  if (minutos >= 60) {
    return 3;
  }
  if (minutos >= 30) {
    return 2;
  }
  if (minutos > 0) {
    return 1;
  }
  return 0;
}

function construirMapa(sesiones, hoy) {
  const hoyTexto = fechaEnTexto(hoy);
  const totalPorDia = {};

  for (const sesion of sesiones) {
    if (sesion.fecha <= hoyTexto) {
      totalPorDia[sesion.fecha] = (totalPorDia[sesion.fecha] ?? 0) + (Number(sesion.minutos) || 0);
    }
  }

  const inicio = lunesDeSemana(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 77));
  const semanas = [];

  for (let columna = 0; columna < 12; columna++) {
    const lunesDeColumna = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + columna * 7);
    const celdas = [];

    for (let dia = 0; dia < 7; dia++) {
      const fecha = new Date(lunesDeColumna.getFullYear(), lunesDeColumna.getMonth(), lunesDeColumna.getDate() + dia);
      const fechaTexto = fechaEnTexto(fecha);
      const minutos = totalPorDia[fechaTexto] ?? 0;

      celdas.push({
        fecha: fechaTexto,
        minutos: minutos,
        nivel: nivelDeIntensidad(minutos),
        futuro: fechaTexto > hoyTexto,
      });
    }

    semanas.push({ lunes: fechaEnTexto(lunesDeColumna), celdas: celdas });
  }

  return { inicio: fechaEnTexto(inicio), hoy: hoyTexto, semanas: semanas };
}

function calcularRacha() {
  const diasConSesion = new Set(sesiones.map((sesion) => sesion.fecha));
  const hoy = new Date();
  let fecha = hoy;

  if (!diasConSesion.has(fechaEnTexto(hoy))) {
    fecha = diaAnterior(hoy);
    if (!diasConSesion.has(fechaEnTexto(fecha))) {
      return 0;
    }
  }

  let racha = 0;
  while (diasConSesion.has(fechaEnTexto(fecha))) {
    racha = racha + 1;
    fecha = diaAnterior(fecha);
  }
  return racha;
}

function calcularMejorRacha() {
  const fechas = Array.from(new Set(sesiones.map((sesion) => sesion.fecha))).sort();
  let mejor = 0;
  let rachaActual = 0;
  let anterior = "";

  for (const fecha of fechas) {
    if (anterior !== "" && fechaEnTexto(diaAnterior(fechaDesdeTexto(fecha))) === anterior) {
      rachaActual = rachaActual + 1;
    } else {
      rachaActual = 1;
    }
    if (rachaActual > mejor) {
      mejor = rachaActual;
    }
    anterior = fecha;
  }
  return mejor;
}

function pintarRacha() {
  const racha = calcularRacha();
  numeroRacha.textContent = racha;
  textoRacha.textContent = racha === 1 ? "día seguido estudiando" : "días seguidos estudiando";
}

function pintarMejorRacha() {
  const mejor = calcularMejorRacha();
  numeroMejor.textContent = mejor;
  filaMejor.hidden = mejor === 0;
}

function lunesDeEstaSemana() {
  const hoy = new Date();
  const diasDesdeLunes = (hoy.getDay() + 6) % 7;
  let lunes = hoy;
  for (let i = 0; i < diasDesdeLunes; i++) {
    lunes = diaAnterior(lunes);
  }
  return fechaEnTexto(lunes);
}

function calcularMinutosSemana() {
  const lunes = lunesDeEstaSemana();
  const hoy = fechaEnTexto(new Date());
  let total = 0;
  for (const sesion of sesiones) {
    if (sesion.fecha >= lunes && sesion.fecha <= hoy) {
      total = total + (Number(sesion.minutos) || 0);
    }
  }
  return total;
}

function pintarTotalSemana() {
  textoTotalSemana.textContent = minutosLegibles(calcularMinutosSemana());
}

function primerDiaDelMes() {
  const hoy = new Date();
  return fechaEnTexto(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
}

function calcularDiasEstudiadosMes() {
  const primerDia = primerDiaDelMes();
  const hoy = fechaEnTexto(new Date());
  const dias = new Set();
  for (const sesion of sesiones) {
    if (sesion.fecha >= primerDia && sesion.fecha <= hoy) {
      dias.add(sesion.fecha);
    }
  }
  return dias.size;
}

function pintarDiasEstudiadosMes() {
  const dias = calcularDiasEstudiadosMes();
  textoDiasMes.textContent = dias === 1 ? "1 día" : dias + " días";
}

function ordenarSesiones(lista) {
  return lista.slice().sort((a, b) => {
    if (a.fecha === b.fecha) {
      return 0;
    }
    return a.fecha < b.fecha ? 1 : -1;
  });
}

function pintarSesiones() {
  const ordenadas = ordenarSesiones(sesiones);
  listaSesiones.textContent = "";
  textoVacio.hidden = ordenadas.length > 0;

  for (const sesion of ordenadas) {
    const item = document.createElement("li");
    item.className = "sesion";

    const datos = document.createElement("div");

    const tema = document.createElement("p");
    tema.className = "sesion-tema";
    tema.textContent = sesion.tema;

    const fecha = document.createElement("p");
    fecha.className = "sesion-fecha";
    fecha.textContent = fechaLegible(sesion.fecha);

    const minutos = document.createElement("span");
    minutos.className = "sesion-minutos";
    minutos.textContent = minutosLegibles(sesion.minutos);

    datos.append(tema, fecha);
    item.append(datos, minutos);
    listaSesiones.appendChild(item);
  }
}

function mostrarError(mensaje) {
  cajaError.textContent = mensaje;
  cajaError.hidden = false;
}

function pintarMapa() {
  const mapa = construirMapa(sesiones, new Date());
  contenedorMapa.textContent = "";

  for (const semana of mapa.semanas) {
    const columna = document.createElement("div");
    columna.className = "mapa-semana";

    for (const dia of semana.celdas) {
      if (dia.futuro) {
        continue;
      }

      const celda = document.createElement("span");
      celda.className = "mapa-celda";
      celda.classList.add("nivel-" + dia.nivel);
      celda.dataset.fecha = dia.fecha;
      celda.dataset.minutos = dia.minutos;

      if (dia.nivel > 0) {
        celda.setAttribute("aria-label", fechaLegible(dia.fecha) + ", " + minutosLegibles(dia.minutos));
      } else {
        celda.setAttribute("aria-label", fechaLegible(dia.fecha) + ", sin sesión");
      }

      columna.appendChild(celda);
    }

    contenedorMapa.appendChild(columna);
  }
}

let tooltipAbiertoPorHover = false;

function ocultarTooltip() {
  tooltip.textContent = "";
  tooltip.hidden = true;
  tooltipAbiertoPorHover = false;
}

function mostrarTooltip(celda, evento) {
  tooltip.textContent = fechaLegible(celda.dataset.fecha) + " — " + minutosLegibles(Number(celda.dataset.minutos));
  tooltip.hidden = false;
  tooltip.style.left = evento.clientX + "px";
  tooltip.style.top = evento.clientY + "px";
}

function celdaConActividad(evento) {
  const celda = evento.target.closest(".mapa-celda");
  return Number(celda?.dataset.minutos) > 0 ? celda : null;
}

function prepararTooltip() {
  contenedorMapa.addEventListener("pointerover", (evento) => {
    if (evento.pointerType !== "mouse") {
      return;
    }
    const celda = celdaConActividad(evento);
    if (celda) {
      mostrarTooltip(celda, evento);
      tooltipAbiertoPorHover = true;
    }
  });

  contenedorMapa.addEventListener("pointerout", () => {
    if (tooltipAbiertoPorHover) {
      ocultarTooltip();
    }
  });

  contenedorMapa.addEventListener("click", (evento) => {
    const celda = celdaConActividad(evento);
    if (celda) {
      if (tooltip.hidden) {
        mostrarTooltip(celda, evento);
      } else {
        ocultarTooltip();
      }
    } else {
      ocultarTooltip();
    }
  });
}

function ocultarError() {
  cajaError.textContent = "";
  cajaError.hidden = true;
}

function pintar() {
  pintarRacha();
  pintarMejorRacha();
  pintarTotalSemana();
  pintarDiasEstudiadosMes();
  pintarSesiones();
  pintarMapa();
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  if (campoFecha.value === "") {
    mostrarError("Elige una fecha.");
    campoFecha.focus();
    return;
  }

  if (campoFecha.value > fechaEnTexto(new Date())) {
    mostrarError("La fecha no puede ser futura.");
    campoFecha.focus();
    return;
  }

  if (tema === "") {
    mostrarError("Escribe el tema de la sesión.");
    campoTema.focus();
    return;
  }

  if (!Number.isFinite(minutos) || minutos <= 0) {
    mostrarError("Los minutos tienen que ser un número mayor que 0.");
    campoMinutos.focus();
    return;
  }

  sesiones.unshift({ fecha: campoFecha.value, tema: tema, minutos: Math.round(minutos) });
  guardarSesiones();
  pintar();

  formulario.reset();
  campoFecha.value = fechaEnTexto(new Date());
  ocultarError();
  campoTema.focus();
});

campoFecha.max = fechaEnTexto(new Date());
campoFecha.value = fechaEnTexto(new Date());
pintar();
prepararTooltip();
