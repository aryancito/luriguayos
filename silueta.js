/* Cuerpos en silueta con volumen.
 * Las capas salen de la ilustración (main.py): forma completa, sombras,
 * rasgos oscuros (cejas, ojos, contornos), labios, blancos (dientes y ojos)
 * y cabello. Todas se tiñen a partir de un solo color de silueta, así los
 * rostros son parte de la figura y no dibujos encima.
 *
 * Uso: const cuerpo = Silueta.dibujar(grupoSvg, ESCENA);  cuerpo.color("#d08a5a");
 */
(() => {
  const NS = "http://www.w3.org/2000/svg";

  const aRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const aHex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
  const mezclar = (a, b, t) => aHex(aRgb(a).map((v, i) => v + (aRgb(b)[i] - v) * t));
  const escalar = (hex, f) => aHex(aRgb(hex).map((v) => v * f));

  // paleta derivada del color de la silueta
  function tonos(hex) {
    return {
      luz: hex,
      sombra: mezclar(escalar(hex, 0.8), "#8a3b2a", 0.18),
      rasgos: mezclar(escalar(hex, 0.25), "#2a120c", 0.4),
      labios: mezclar(escalar(hex, 0.62), "#b3132b", 0.6),
      claros: mezclar(hex, "#ffffff", 0.88),
    };
  }

  function dibujar(grupo, escena) {
    const s = escena.silueta;
    const capas = {};
    const capa = (nombre, d, fill) => {
      if (!d) return;
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", `cuerpo-${nombre}`);
      if (fill) p.setAttribute("fill", fill);
      grupo.appendChild(p);
      capas[nombre] = p;
    };
    capa("luz", s.d);
    capa("sombra", s.sombra);
    capa("rasgos", s.rasgos);
    capa("labios", s.labios);
    capa("claros", s.claros);
    if (escena.cabello) capa("cabello", escena.cabello.d, escena.cabello.color);

    function color(hex, animar = false) {
      const t = tonos(hex);
      Object.entries(t).forEach(([k, v]) => {
        if (!capas[k]) return;
        if (animar && window.gsap) window.gsap.to(capas[k], { attr: { fill: v }, duration: 0.3 });
        else capas[k].setAttribute("fill", v);
      });
    }
    color(s.color);
    return { grupo, color, capas };
  }

  window.Silueta = { dibujar };
})();
