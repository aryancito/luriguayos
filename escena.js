/* Luriguayos · Modelado
 * Dibuja la escena vectorizada (data/escena.js, generada por main.py):
 * una base fija (piel, pelo, rostros) y encima cada prenda, que es lo único
 * que cambia de color. Animaciones con GSAP.
 * ?sinanim=1 salta animaciones · ?original muestra los colores originales.
 */
(() => {
  const G = window.gsap;
  const { NOMBRES_ROL, PALETAS, ESQUEMAS, clamp, hslAHex, hexAHsl, mapearTono, mulberry32 } = window.Motor;
  const ESCENA = window.ESCENA;
  const NS = "http://www.w3.org/2000/svg";
  const params = new URLSearchParams(location.search);
  const sinAnimacion = params.has("sinanim") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);

  const estado = new Map(); // id -> { pieza, roles, tonos, paths:{tono:el}, grupo, fantasma, brillo, centro }
  let seleccion = null;
  let vestidos = true;
  let cuerpo = null;
  let semilla = Number(params.get("seed")) || nuevaSemilla();

  function nuevaSemilla() { return Math.floor(Math.random() * 1e6); }

  const el = (tag, attrs = {}) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };

  /* ---------- construcción ---------- */
  function construir() {
    // cuerpos: silueta de un solo tono (por defecto) o versión ilustrada
    // con volumen y rasgos tomados de la ilustración
    cuerpo = Silueta.dibujar($("#cuerpo"), ESCENA);
    $("#opt-silueta").value = ESCENA.silueta.color;
    const base = $("#base");
    ESCENA.base.forEach((t) => base.appendChild(el("path", { fill: t.color, d: t.d, class: "tono-base" })));

    const defs = $("#escena defs");
    ESCENA.prendas.forEach((p) => {
      const [x1, y1, x2, y2] = p.caja;
      const centro = [(x1 + x2) / 2, (y1 + y2) / 2];

      // silueta guía (se ve al desvestir y durante la entrada)
      const fantasma = el("path", { d: p.silueta, class: "fantasma" });
      $("#fantasmas").appendChild(fantasma);

      const grupo = el("g", { class: "prenda", "data-id": p.id });
      const paths = {};
      p.tonos.forEach((t) => {
        const path = el("path", { fill: t.color, d: t.d, class: "tono", "data-tono": t.id });
        paths[t.id] = path;
        grupo.appendChild(path);
      });
      $("#prendas").appendChild(grupo);

      // franja de luz que recorre la prenda, recortada a su silueta
      const clip = el("clipPath", { id: `clip-${p.id}` });
      clip.appendChild(el("path", { d: p.silueta }));
      defs.appendChild(clip);
      const marco = el("g", { "clip-path": `url(#clip-${p.id})` });
      const brillo = el("rect", {
        x: x1 - 220, y: y1 - 40, width: 120, height: y2 - y1 + 80,
        fill: "url(#grad-brillo)", opacity: 0, class: "brillo",
      });
      marco.appendChild(brillo);
      $("#brillos").appendChild(marco);

      estado.set(p.id, { pieza: p, roles: {}, tonos: {}, paths, grupo, fantasma, brillo, centro });
    });
  }

  /* ---------- color ---------- */
  function colorDe(st, t) {
    if (st.tonos[t.id]) return st.tonos[t.id];
    const obj = st.roles[t.rol];
    if (!obj) return t.color;
    return mapearTono(t, st.pieza.roles.find((r) => r.rol === t.rol), obj);
  }

  function pintar(st, { duracion = 0.7, onda = true } = {}) {
    st.pieza.tonos.forEach((t) => {
      const path = st.paths[t.id];
      const color = colorDe(st, t);
      if (G && !sinAnimacion) {
        G.to(path, { fill: color, duration: duracion, ease: "power2.out", overwrite: "auto",
          delay: onda ? Math.random() * 0.45 : 0 });
      } else {
        path.style.fill = color;
      }
    });
    if (st === seleccion) sincronizarPanel();
  }

  function editables(st) {
    const blancos = $("#opt-blancos").checked;
    return st.pieza.roles.filter((r) => !r.fijo
      && !(blancos && r.rol === "blanco")
      && !(blancos && st.pieza.blanca && r.rol === "tela"));
  }

  function aplicarAzar(st, rnd, matizBase) {
    const offs = ESQUEMAS[$("#esquema").value];
    st.roles = {}; st.tonos = {};
    editables(st).forEach((r, i) => {
      const h = offs ? matizBase + offs[i % offs.length] + (rnd() - 0.5) * 20 : rnd() * 360;
      const s = 0.6 + rnd() * 0.35;
      const claro = r.rol === "blanco" || (st.pieza.blanca && r.rol === "tela");
      const l = claro ? 0.55 + rnd() * 0.25
        : r.rol === "gris" ? r.l
        : clamp(r.l + (rnd() - 0.5) * 0.2, 0.25, 0.65);
      st.roles[r.rol] = { h, s, l };
    });
  }

  function aplicarPaleta(st, colores, desfase) {
    st.roles = {}; st.tonos = {};
    if (!colores) return;
    editables(st).forEach((r, i) => (st.roles[r.rol] = hexAHsl(colores[(i + desfase) % colores.length])));
  }

  // las sandalias quedan negras en azar y paletas (se editan a mano desde su panel)
  function prendas() {
    return [...estado.values()].filter((st) => !/sandalias/.test(st.pieza.id));
  }

  function azarGlobal(nueva = true) {
    if (nueva) semilla = nuevaSemilla();
    actualizarSemilla();
    const rnd = mulberry32(semilla);
    const base = rnd() * 360;
    const conjunto = $("#opt-conjunto").checked;
    prendas().forEach((st, i) => {
      // en conjunto coordinado cada prenda gira un poco la armonía para no repetir colores
      aplicarAzar(st, rnd, conjunto ? base + i * 47 : rnd() * 360);
      pintar(st);
    });
    barrido(prendas());
  }

  function paletaGlobal(nombre) {
    prendas().forEach((st, i) => { aplicarPaleta(st, PALETAS[nombre], i); pintar(st); });
    barrido(prendas());
    aviso(`Paleta «${nombre}»`);
  }

  function actualizarSemilla() {
    $("#seed").textContent = semilla;
    const url = new URL(location.href);
    url.searchParams.set("seed", semilla);
    history.replaceState(null, "", url);
  }

  /* ---------- panel ---------- */
  function seleccionar(st) {
    if (seleccion) seleccion.grupo.classList.remove("sel");
    seleccion = st;
    $("#panel-vacio").hidden = !!st;
    $("#panel-prenda").hidden = !st;
    if (!st) return;
    st.grupo.classList.add("sel");
    $("#pp-nombre").textContent = st.pieza.nombre;
    $("#pp-info").textContent = `${st.pieza.tonos.length} tonos · ${st.pieza.roles.length} zonas de color`;
    const cont = $("#pp-roles");
    cont.innerHTML = "";
    st.pieza.roles.forEach((r) => {
      const chip = document.createElement("label");
      chip.className = "rol" + (r.fijo ? " fijo" : "");
      chip.dataset.rol = r.rol;
      chip.innerHTML = `<input type="color"> ${NOMBRES_ROL[r.rol] || r.rol} <em>${r.tonos}</em>`;
      const input = $("input", chip);
      input.addEventListener("input", () => {
        st.roles[r.rol] = hexAHsl(input.value);
        pintar(st, { duracion: 0.25, onda: false });
      });
      chip.addEventListener("mouseenter", () => resaltarRol(st, r.rol));
      cont.appendChild(chip);
    });
    sincronizarPanel();
    if (G && !sinAnimacion) {
      G.from("#panel-prenda", { x: 30, opacity: 0, duration: 0.35, ease: "power2.out" });
      G.from("#pp-roles .rol", { scale: 0, duration: 0.35, ease: "back.out(2)", stagger: 0.03 });
      G.fromTo(st.grupo, { scale: 1 }, { scale: 1.03, svgOrigin: st.centro.join(" "),
        duration: 0.16, yoyo: true, repeat: 1, ease: "power1.inOut" });
      barrido([st]);
    }
  }

  function sincronizarPanel() {
    if (!seleccion) return;
    seleccion.pieza.roles.forEach((r) => {
      const input = $(`#pp-roles .rol[data-rol="${r.rol}"] input`);
      const obj = seleccion.roles[r.rol] || r;
      if (input && document.activeElement !== input) input.value = hslAHex(obj.h, obj.s, obj.l);
    });
  }

  function resaltarRol(st, rol) {
    if (!G) return;
    const ps = st.pieza.tonos.filter((t) => t.rol === rol).map((t) => st.paths[t.id]);
    G.fromTo(ps, { opacity: 0.1 }, { opacity: 1, duration: 0.25, repeat: 2, yoyo: true, clearProps: "opacity" });
  }

  function construirLista() {
    const ul = $("#lista-prendas");
    [["mujer", "Ella"], ["varon", "Él"]].forEach(([fig, titulo]) => {
      const li = document.createElement("li");
      li.className = "lista-titulo";
      li.textContent = titulo;
      ul.appendChild(li);
      ESCENA.prendas.filter((p) => p.figura === fig).forEach((p) => {
        const item = document.createElement("li");
        const b = document.createElement("button");
        b.textContent = p.nombre;
        const st = estado.get(p.id);
        b.addEventListener("click", () => seleccionar(st));
        b.addEventListener("mouseenter", () => st.grupo.classList.add("hover"));
        b.addEventListener("mouseleave", () => st.grupo.classList.remove("hover"));
        item.appendChild(b);
        ul.appendChild(item);
      });
    });
  }

  /* ---------- animaciones ---------- */
  function barrido(lista) {
    if (!G || sinAnimacion) return;
    lista.forEach((st, i) => {
      const [x1, , x2] = st.pieza.caja;
      G.fromTo(st.brillo, { attr: { x: x1 - 220 }, opacity: 1 },
        { attr: { x: x2 + 100 }, duration: 0.9, ease: "power2.inOut", delay: 0.15 + i * 0.05,
          onComplete: () => G.set(st.brillo, { opacity: 0 }) });
    });
  }

  function entrada() {
    if (!G) return;
    const lista = [...estado.values()];
    const tl = G.timeline();
    guia(true);
    tl.from(".cabecera", { y: -80, opacity: 0, duration: 0.6, ease: "power3.out" })
      .from(".halo", { scale: 0.3, opacity: 0, svgOrigin: "724 540", duration: 1.1, ease: "power2.out" }, "<")
      .from(".fantasma", { opacity: 0, duration: 0.6, stagger: 0.03 }, "-=0.7")
      .from("#cuerpo", { opacity: 0, scale: 0.96, svgOrigin: "724 1060", duration: 0.8, ease: "power2.out" }, "-=0.5")
      .from(".tono-base", { opacity: 0, duration: 0.6, stagger: { each: 0.012, from: "random" } }, "<");
    // las prendas caen sobre su silueta, de los pies a la cabeza
    const orden = [...lista].sort((a, b) => b.pieza.caja[3] - a.pieza.caja[3]);
    orden.forEach((st, i) => {
      tl.from(st.grupo, {
        y: -160, opacity: 0, scale: 0.85, rotation: G.utils.random(-10, 10),
        svgOrigin: st.centro.join(" "), duration: 0.7, ease: "back.out(1.6)",
      }, i === 0 ? "-=0.2" : "-=0.55");
    });
    tl.from(".panel > :not([hidden])", { x: 40, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.4");
    tl.add(() => { guia(false); azarGlobal(false); flotar(); }, "-=0.1");
    if (sinAnimacion) tl.progress(1);
    return tl;
  }

  const guia = (on) => $("#escena").classList.toggle("guia", on);

  function flotar() {
    if (!G || sinAnimacion) return;
    G.to("#mundo", { y: -6, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
    G.to(".piso", { attr: { rx: 585 }, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
  }

  function alternarVestido() {
    if (!G) return;
    const lista = [...estado.values()];
    vestidos = !vestidos;
    $("#btn-vestir").textContent = vestidos ? "👕 Desvestir" : "👗 Vestir";
    if (!vestidos) {
      seleccionar(null);
      guia(true);
      G.to(lista.map((s) => s.grupo), {
        y: () => G.utils.random(-500, -300), x: () => G.utils.random(-200, 200),
        rotation: () => G.utils.random(-40, 40), opacity: 0, svgOrigin: "724 543",
        duration: 0.7, ease: "power2.in", stagger: 0.05,
      });
    } else {
      const orden = [...lista].sort((a, b) => b.pieza.caja[3] - a.pieza.caja[3]);
      G.to(orden.map((s) => s.grupo), {
        x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.5)", stagger: 0.08,
        onComplete: () => { guia(false); barrido(lista); },
      });
    }
  }

  function repetirEntrada() {
    if (!G) return;
    G.killTweensOf("#mundo, .piso, .prenda, .fantasma, .tono-base, .halo, #cuerpo");
    G.set("#mundo, .piso, .prenda, .fantasma, .tono-base, .halo, #cuerpo, .cabecera, .panel > *", { clearProps: "all" });
    estado.forEach((st) => {
      st.roles = {}; st.tonos = {};
      st.pieza.tonos.forEach((t) => (st.paths[t.id].style.fill = t.color));
    });
    vestidos = true;
    $("#btn-vestir").textContent = "👕 Desvestir";
    entrada();
  }

  /* ---------- interacción ---------- */
  let popActual = null;
  function initInteraccion() {
    const escena = $("#escena");
    const etiqueta = $("#etiqueta");
    const marco = $(".escenario-modelo");

    escena.addEventListener("pointermove", (e) => {
      const g = e.target.closest(".prenda");
      if (!g) { etiqueta.style.opacity = 0; return; }
      const r = marco.getBoundingClientRect();
      etiqueta.textContent = estado.get(g.dataset.id).pieza.nombre;
      Object.assign(etiqueta.style, { left: `${e.clientX - r.left}px`, top: `${e.clientY - r.top}px`, opacity: 1 });
    });
    escena.addEventListener("pointerleave", () => (etiqueta.style.opacity = 0));

    escena.addEventListener("click", (e) => {
      const g = e.target.closest(".prenda");
      if (!g) { seleccionar(null); cerrarPop(); return; }
      const st = estado.get(g.dataset.id);
      if (st === seleccion) {
        const path = e.target.closest(".tono");
        if (path) abrirPop(st, path, e);
      } else {
        seleccionar(st);
        cerrarPop();
      }
    });

    $("#pop-color").addEventListener("input", (e) => {
      if (!popActual) return;
      popActual.st.tonos[popActual.t.id] = e.target.value;
      $("#pop-muestra").style.background = e.target.value;
      pintar(popActual.st, { duracion: 0.2, onda: false });
    });
    $("#pop-reset").addEventListener("click", () => {
      if (!popActual) return;
      delete popActual.st.tonos[popActual.t.id];
      pintar(popActual.st, { duracion: 0.4, onda: false });
      cerrarPop();
    });
    $("#pop-cerrar").addEventListener("click", cerrarPop);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { cerrarPop(); seleccionar(null); } });

    // mantener presionado "Ver original" muestra la ilustración de referencia encima
    const ref = $("#ref");
    const mostrar = (on) => (G ? G.to(ref, { attr: { opacity: on ? 1 : 0 }, duration: 0.25 })
      : ref.setAttribute("opacity", on ? 1 : 0));
    const btn = $("#btn-original");
    btn.addEventListener("pointerdown", () => mostrar(true));
    ["pointerup", "pointerleave"].forEach((ev) => btn.addEventListener(ev, () => mostrar(false)));
  }

  function abrirPop(st, path, e) {
    const t = st.pieza.tonos.find((x) => x.id === path.dataset.tono);
    const color = colorDe(st, t);
    popActual = { st, t };
    $("#pop-titulo").textContent = `Tono ${t.id.split("_t").pop()}`;
    $("#pop-sub").textContent = `${NOMBRES_ROL[t.rol] || t.rol} · ${st.pieza.nombre}`;
    $("#pop-color").value = color;
    $("#pop-muestra").style.background = color;
    const pop = $("#pop");
    pop.hidden = false;
    Object.assign(pop.style, {
      left: `${Math.min(e.clientX + 12, innerWidth - 245)}px`,
      top: `${Math.min(e.clientY + 12, innerHeight - 170)}px`,
    });
    if (G) {
      G.fromTo(pop, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2)" });
      G.fromTo(path, { opacity: 0.15 }, { opacity: 1, duration: 0.18, repeat: 3, yoyo: true, clearProps: "opacity" });
    }
  }
  function cerrarPop() { $("#pop").hidden = true; popActual = null; }

  function aviso(txt) {
    const t = $("#toast");
    t.textContent = txt;
    if (!G) return;
    G.killTweensOf(t);
    G.timeline().to(t, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(2)" })
      .to(t, { y: 80, opacity: 0, duration: 0.3, delay: 1.4 });
  }

  /* ---------- arranque ---------- */
  function iniciar() {
    if (!ESCENA) {
      $("#escena").insertAdjacentHTML("afterend", "<p>Falta data/escena.js: ejecuta <code>python main.py</code>.</p>");
      return;
    }
    construir();
    construirLista();
    initInteraccion();

    const contPal = $("#paletas");
    Object.entries(PALETAS).forEach(([nombre, cols]) => {
      const b = document.createElement("button");
      b.className = "btn paleta-btn";
      const muestras = (cols || ["#d7011b", "#0481cf", "#fccb05", "#f8f4fc"]).slice(0, 5)
        .map((c) => `<span style="background:${c}"></span>`).join("");
      b.innerHTML = `<i>${muestras}</i>${nombre}`;
      b.addEventListener("click", () => paletaGlobal(nombre));
      contPal.appendChild(b);
    });

    $("#btn-azar").addEventListener("click", () => azarGlobal(true));
    $("#esquema").addEventListener("change", () => azarGlobal(true));
    $("#opt-blancos").addEventListener("change", () => azarGlobal(false));
    $("#opt-silueta").addEventListener("input", (e) => {
      cuerpo.color(e.target.value, true);
    });
    $("#opt-ilustrado").addEventListener("change", (e) => {
      $("#base").style.display = e.target.checked ? "" : "none";
      $("#cuerpo").style.display = e.target.checked ? "none" : "";
    });
    $("#btn-replay").addEventListener("click", repetirEntrada);
    $("#btn-vestir").addEventListener("click", alternarVestido);
    $("#btn-seed").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(location.href); aviso("Enlace copiado"); }
      catch { aviso(`Semilla ${semilla}`); }
    });
    $("#pp-azar").addEventListener("click", () => {
      if (!seleccion) return;
      const rnd = mulberry32(nuevaSemilla());
      aplicarAzar(seleccion, rnd, rnd() * 360);
      pintar(seleccion);
      barrido([seleccion]);
    });
    $("#pp-orig").addEventListener("click", () => {
      if (!seleccion) return;
      seleccion.roles = {}; seleccion.tonos = {};
      pintar(seleccion);
      barrido([seleccion]);
    });
    $("#pp-cerrar").addEventListener("click", () => seleccionar(null));

    // ?zoom=x,y,ancho,alto acerca la cámara (útil para revisar detalles)
    if (params.get("zoom")) $("#escena").setAttribute("viewBox", params.get("zoom").split(",").join(" "));
    actualizarSemilla();
    if (G) G.set("#toast", { xPercent: -50, y: 80 });
    if (params.has("original")) return; // colores tal cual la ilustración
    if (G) entrada(); else azarGlobal(false);
  }

  iniciar();
})();
