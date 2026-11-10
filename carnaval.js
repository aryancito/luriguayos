/* Carnaval: serpentinas, globos, papel picado y espuma (spray).
 * Todo son elementos pequeños animados con transform/opacity (se componen
 * por separado, no obligan a redibujar la página).
 *
 * Carnaval.guirnalda(contenedor)  serpentinas colgando que se mecen
 * Carnaval.globos()               globos que suben; al tocarlos revientan
 * Carnaval.lluvia()               lluvia de serpentinas y papel picado
 * Carnaval.espuma(x, y, dir)      chorro de espuma de carnaval
 */
(() => {
  const G = window.gsap;
  const NS = "http://www.w3.org/2000/svg";
  const COLORES = ["#c8102e", "#f2b705", "#e5197e", "#1f9d55", "#1d4fbf", "#ff7a00", "#8e24aa", "#00a6c8"];
  const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const azar = (a, b) => a + Math.random() * (b - a);
  const color = () => COLORES[Math.floor(Math.random() * COLORES.length)];

  let capa = null;
  function capaFija() {
    if (capa) return capa;
    capa = document.createElement("div");
    capa.className = "carnaval";
    document.body.appendChild(capa);
    return capa;
  }

  function svg(w, h, contenido, clase) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", `0 0 ${w} ${h}`);
    s.setAttribute("width", w);
    s.setAttribute("height", h);
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("class", clase);
    s.innerHTML = contenido;
    return s;
  }

  // serpentina rizada: una cinta en espiral (onda que se enrolla)
  function serpentina(c, largo) {
    let d = "M10 4";
    for (let y = 4, i = 0; y < largo; y += 14, i++) {
      const x = i % 2 ? 2 : 18;
      d += ` Q${x} ${y + 7} 10 ${y + 14}`;
    }
    return svg(20, largo + 8, `<path d="${d}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`, "serpentina");
  }

  /* guirnalda: serpentinas colgando del borde superior de un contenedor */
  function guirnalda(cont) {
    const g = document.createElement("div");
    g.className = "guirnalda";
    cont.appendChild(g);
    const n = 9;
    for (let i = 0; i < n; i++) {
      const s = serpentina(color(), azar(50, 120));
      s.style.left = `${(i + 0.5) * (100 / n) + azar(-3, 3)}%`;
      g.appendChild(s);
      if (G && !reducido) {
        G.from(s, { scaleY: 0, transformOrigin: "50% 0%", duration: 0.9, delay: 0.4 + i * 0.06, ease: "bounce.out" });
        G.to(s, { rotation: azar(-9, 9), transformOrigin: "50% 0%", duration: azar(1.4, 2.2),
          yoyo: true, repeat: -1, ease: "sine.inOut", delay: azar(0, 1) });
      }
    }
    // banderines de colores sobre la guirnalda
    const ban = svg(400, 30, Array.from({ length: 16 }, (_, i) =>
      `<path d="M${i * 25} 2 L${i * 25 + 25} 2 L${i * 25 + 12.5} 26 Z" fill="${COLORES[i % COLORES.length]}"/>`).join("")
      + `<path d="M0 2 Q200 10 400 2" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>`, "banderines");
    ban.setAttribute("preserveAspectRatio", "none");
    g.appendChild(ban);
    if (G && !reducido) G.from(ban, { y: -40, duration: 0.7, ease: "back.out(2)", delay: 0.2 });
  }

  /* globos que suben por la pantalla */
  function globo() {
    const c = color();
    const w = azar(28, 40);
    const g = svg(60, 120,
      `<defs><radialGradient id="b${Math.random().toString(36).slice(2)}" cx=".35" cy=".3" r=".75"></radialGradient></defs>`
      + `<path d="M30 2 C52 2 58 22 58 38 C58 60 42 76 30 80 C18 76 2 60 2 38 C2 22 8 2 30 2 Z" fill="${c}"/>`
      + `<ellipse cx="20" cy="24" rx="7" ry="11" fill="#fff" opacity=".35" transform="rotate(-20 20 24)"/>`
      + `<path d="M26 80 L34 80 L30 86 Z" fill="${c}"/>`
      + `<path d="M30 86 C24 96 36 104 30 118" fill="none" stroke="#555" stroke-opacity=".5" stroke-width="1.2"/>`, "globo");
    g.style.width = `${w}px`;
    g.style.height = `${w * 2}px`;
    // solo por los costados: no tapan a la pareja ni los datos
    g.style.left = Math.random() < 0.5 ? `${azar(0, 6)}%` : `${azar(88, 93)}%`;
    g.dataset.color = c;
    capaFija().appendChild(g);
    const sube = G.fromTo(g, { y: innerHeight + 40 },
      { y: -w * 2 - 20, duration: azar(11, 18), ease: "none", onComplete: () => { g.remove(); globo(); } });
    G.to(g, { x: azar(-40, 40), rotation: azar(-12, 12), duration: azar(1.8, 3), yoyo: true, repeat: -1, ease: "sine.inOut" });
    g.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      sube.kill();
      G.killTweensOf(g);
      const r = g.getBoundingClientRect();
      picado(r.left + r.width / 2, r.top + r.width / 2, 22, [c, "#fff", color()]);
      G.to(g, { scale: 1.4, opacity: 0, duration: 0.12, onComplete: () => { g.remove(); G.delayedCall(azar(1, 3), globo); } });
    });
  }

  function globos(cuantos = 6) {
    if (!G || reducido) return;
    for (let i = 0; i < cuantos; i++) G.delayedCall(i * azar(1.2, 2.2), globo);
  }

  /* papel picado que estalla desde un punto */
  function picado(x, y, n = 30, cols = COLORES) {
    if (!G || reducido) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "picado";
      p.style.background = cols[i % cols.length];
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      if (Math.random() < 0.4) p.style.borderRadius = "50%";
      capaFija().appendChild(p);
      const ang = azar(0, Math.PI * 2), r = azar(40, 160);
      G.timeline({ onComplete: () => p.remove() })
        .to(p, { x: Math.cos(ang) * r, y: Math.sin(ang) * r - 40, rotation: azar(-360, 360), duration: 0.5, ease: "power3.out" })
        .to(p, { y: `+=${azar(160, 360)}`, x: `+=${azar(-40, 40)}`, rotationX: azar(-540, 540), opacity: 0,
          duration: azar(1.2, 2), ease: "power1.in" });
    }
  }

  /* lluvia de serpentinas y papel picado desde arriba */
  function lluvia(n = 14) {
    if (!G || reducido) return;
    for (let i = 0; i < n; i++) {
      const s = serpentina(color(), azar(60, 140));
      s.classList.add("cae");
      s.style.left = `${azar(0, 96)}%`;
      capaFija().appendChild(s);
      G.fromTo(s, { y: -160, rotation: azar(-60, 60) },
        { y: innerHeight + 40, rotation: `+=${azar(-200, 200)}`, x: azar(-60, 60), duration: azar(2.4, 4),
          delay: azar(0, 0.8), ease: "power1.in", onComplete: () => s.remove() });
    }
    for (let i = 0; i < 4; i++) G.delayedCall(i * 0.15, () => picado(azar(40, innerWidth - 40), azar(40, 160), 14));
  }

  /* espuma de carnaval: burbujas blancas que salen en chorro y se desvanecen */
  function espuma(x, y, dir = -1) {
    if (!G) return;
    for (let i = 0; i < 130; i++) {
      const b = document.createElement("i");
      b.className = "espuma";
      const t = azar(3, 9);
      Object.assign(b.style, { width: `${t}px`, height: `${t}px`, left: `${x}px`, top: `${y}px` });
      capaFija().appendChild(b);
      // el chorro sale en abanico hacia arriba y al lado indicado
      const ang = (-Math.PI / 2) + dir * azar(0.15, 0.9);
      const r = azar(120, Math.min(innerWidth, 520) * 0.85);
      G.timeline({ delay: i * 0.006, onComplete: () => b.remove() })
        .fromTo(b, { scale: 0.2, opacity: 1 }, { x: Math.cos(ang) * r, y: Math.sin(ang) * r, scale: azar(0.8, 1.6),
          duration: azar(0.4, 0.7), ease: "power2.out" })
        .to(b, { y: `+=${azar(30, 90)}`, scale: "*=1.15", duration: azar(1.2, 2), ease: "sine.in" })
        .to(b, { opacity: 0, duration: 0.6 }, "-=0.6");
    }
  }

  window.Carnaval = { guirnalda, globos, lluvia, espuma, picado };
})();
