/* Motor de color compartido (escena y galería).
 * Cada tono se traslada del color promedio de su rol al color objetivo,
 * conservando su diferencia de matiz, saturación y luz: así se mantiene
 * el sombreado de la ilustración.
 */
(() => {
  const NOMBRES_ROL = {
    rojo: "Rojo", rosa: "Rosa / fucsia", naranja: "Naranja", amarillo: "Amarillo",
    verde: "Verde", azul: "Azul", morado: "Morado", blanco: "Blanco",
    gris: "Gris", contorno: "Contorno", piel: "Piel", tela: "Tela", detalle: "Detalle",
  };

  const PALETAS = {
    "Original": null,
    "Fiesta": ["#d7011b", "#f8067e", "#fccb05", "#0481cf", "#29d284", "#fd8320", "#6a1b9a"],
    "Altiplano": ["#1d3557", "#c1121f", "#f1c40f", "#2a9d8f", "#8d5524", "#f4a261", "#5a189a"],
    "Atardecer": ["#ff5e5b", "#ffb400", "#d81159", "#8f2d56", "#ff8c42", "#ffd166", "#73d2de"],
    "Selva": ["#2d6a4f", "#ffb703", "#d00000", "#95d5b2", "#fb8500", "#023047", "#e9c46a"],
    "Nocturna": ["#3a0ca3", "#ff006e", "#7b2cbf", "#c77dff", "#4cc9f0", "#240046", "#ffbe0b"],
  };

  const ESQUEMAS = {
    analoga: [0, 30, -30, 60, -60, 15, -15],
    complementaria: [0, 180, 25, 205, -25, 155],
    triadica: [0, 120, 240, 30, 150, 270],
    tetradica: [0, 90, 180, 270, 45, 225],
  };

  /* ---------- utilidades de color ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const envolver = (h) => ((h % 360) + 360) % 360;
  const difMatiz = (a, b) => ((a - b + 540) % 360) - 180;

  function hslAHex(h, s, l) {
    h = envolver(h);
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(255 * c).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function hexAHsl(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h * 60, s, l };
  }

  /* Traslada un tono de su rol original al color objetivo, manteniendo
   * su variación de matiz, saturación y luz respecto al promedio del rol. */
  function mapearTono(t, ref, obj) {
    const h = obj.h + difMatiz(t.h, ref.h);
    const s = ref.s > 0.05 ? clamp((t.s * obj.s) / ref.s) : obj.s;
    const l = clamp(t.l + (obj.l - ref.l), 0.03, 0.97);
    return hslAHex(h, s, l);
  }

  /* ---------- azar reproducible ---------- */
  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  window.Motor = {
    NOMBRES_ROL, PALETAS, ESQUEMAS, clamp, hslAHex, hexAHsl, mapearTono, mulberry32,
  };
})();
