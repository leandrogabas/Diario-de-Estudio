const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function crearElemento() {
  return {
    textContent: "",
    hidden: true,
    value: "",
    max: "",
    className: "",
    style: {},
    addEventListener() {},
    appendChild() {},
    append() {},
    focus() {},
    reset() {},
    setAttribute() {},
    closest() {
      return null;
    },
    classList: {
      add() {},
    },
    dataset: {},
  };
}

function cargarApp() {
  const sandbox = {
    document: {
      getElementById() {
        return crearElemento();
      },
      createElement() {
        return crearElemento();
      },
    },
    localStorage: {
      getItem() {
        return "[]";
      },
      setItem() {},
    },
  };

  vm.createContext(sandbox);
  const codigo = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  vm.runInContext(codigo, sandbox, { filename: "app.js" });
  return sandbox;
}

test("app.js se carga con los stubs y expone su lógica pura", () => {
  const app = cargarApp();

  assert.equal(typeof app.leerSesiones, "function");
  assert.equal(typeof app.fechaEnTexto, "function");
  assert.equal(typeof app.minutosLegibles, "function");
  assert.equal(typeof app.calcularRacha, "function");
  assert.equal(typeof app.lunesDeSemana, "function");
  assert.equal(typeof app.nivelDeIntensidad, "function");
  assert.equal(typeof app.construirMapa, "function");
});

test("lunesDeSemana devuelve el lunes de la misma semana (lunes como inicio)", () => {
  const app = cargarApp();

  // Miércoles 2026-07-15 → lunes 2026-07-13
  assert.equal(app.fechaEnTexto(app.lunesDeSemana(new Date(2026, 6, 15))), "2026-07-13");
  // Lunes 2026-07-13 sigue en su misma semana
  assert.equal(app.fechaEnTexto(app.lunesDeSemana(new Date(2026, 6, 13))), "2026-07-13");
  // Domingo 2026-07-19 pertenece a la semana que empieza el lunes 2026-07-13
  assert.equal(app.fechaEnTexto(app.lunesDeSemana(new Date(2026, 6, 19))), "2026-07-13");
});

test("nivelDeIntensidad clasifica los minutos en 4 niveles", () => {
  const app = cargarApp();

  assert.equal(app.nivelDeIntensidad(0), 0);
  assert.equal(app.nivelDeIntensidad(1), 1);
  assert.equal(app.nivelDeIntensidad(29), 1);
  assert.equal(app.nivelDeIntensidad(30), 2);
  assert.equal(app.nivelDeIntensidad(59), 2);
  assert.equal(app.nivelDeIntensidad(60), 3);
  assert.equal(app.nivelDeIntensidad(120), 3);
});

test("construirMapa genera 12 semanas alineadas que empiezan en lunes", () => {
  const app = cargarApp();
  const hoy = new Date(2026, 6, 15); // miércoles
  const mapa = app.construirMapa([], hoy);

  assert.equal(mapa.semanas.length, 12);
  assert.equal(mapa.semanas.every((semana) => semana.celdas.length === 7), true);
  assert.equal(mapa.hoy, "2026-07-15");
  assert.equal(mapa.inicio, "2026-04-27"); // lunes, 77 días antes
  // La primera columna empieza un lunes y su columna izquierda nunca se corta
  assert.equal(mapa.semanas[0].lunes, "2026-04-27");
  assert.equal(mapa.semanas[0].celdas[0].fecha, "2026-04-27");
  // La última columna es la semana actual: 3 días no futuros (lun, mar, mié) + 4 futuros
  const ultima = mapa.semanas[11];
  assert.equal(ultima.lunes, "2026-07-13");
  assert.deepEqual(
    Array.from(ultima.celdas, (c) => c.futuro),
    [false, false, false, true, true, true, true],
  );
});

test("construirMapa cuenta los minutos del día que tocan", () => {
  const app = cargarApp();
  const hoy = new Date(2026, 6, 15);
  const sesiones = [
    { fecha: "2026-07-13", tema: "a", minutos: 25 },
    { fecha: "2026-07-13", tema: "b", minutos: 20 },
    { fecha: "2026-07-14", tema: "c", minutos: 60 },
  ];
  const mapa = app.construirMapa(sesiones, hoy);

  // Mismo día suma (25 + 20 = 45 → nivel 2)
  const lunes20260713 = mapa.semanas[11].celdas[0];
  assert.equal(lunes20260713.minutos, 45);
  assert.equal(lunes20260713.nivel, 2);
  // 60 minutos → nivel 3
  assert.equal(mapa.semanas[11].celdas[1].minutos, 60);
  assert.equal(mapa.semanas[11].celdas[1].nivel, 3);
  // Día sin sesión → vacío
  assert.equal(mapa.semanas[11].celdas[2].minutos, 0);
  assert.equal(mapa.semanas[11].celdas[2].nivel, 0);
});

test("construirMapa ignora sesiones futuras heredadas", () => {
  const app = cargarApp();
  const hoy = new Date(2026, 6, 15);
  const sesiones = [{ fecha: "2026-07-20", tema: "a", minutos: 60 }];
  const mapa = app.construirMapa(sesiones, hoy);

  const futura = mapa.semanas[11].celdas[6]; // domingo 2026-07-19
  assert.equal(futura.futuro, true);
  assert.equal(futura.minutos, 0);
});

test("construirMapa cruza bien el cambio de año", () => {
  const app = cargarApp();
  const hoy = new Date(2026, 0, 5); // lunes 2026-01-05
  const sesiones = [{ fecha: "2025-12-30", tema: "a", minutos: 30 }];
  const mapa = app.construirMapa(sesiones, hoy);

  // El lunes de inicio cae en 2025: 77 días antes del lunes 2026-01-05
  assert.equal(mapa.inicio, "2025-10-20");
  // 2025-12-30 aparece dentro del mapa y cuenta
  const encontrada = mapa.semanas[10].celdas.find((c) => c.fecha === "2025-12-30");
  assert.equal(encontrada.minutos, 30);
});