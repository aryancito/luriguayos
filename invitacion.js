/* Invitación · Asociación de Luriguayos Revelación Fanáticos Juli
 * Página para celulares: sobre que se abre, pareja de danzantes con
 * colores nuevos en cada visita (o al tocarla), datos del evento,
 * cuenta regresiva, confirmación, calendario y compartir.
 */

/* ======== DATOS DEL EVENTO: completar aquí ========
 * Lo que quede vacío se muestra como "Por confirmar".
 * fecha: "AAAA-MM-DD"   hora: "HH:MM" en formato 24 h (hora de Perú), p. ej. "19:00"
 * ubicacion: [latitud, longitud] del local (mapa y botón "Cómo llegar")
 * whatsapp: número con código de país, solo dígitos, p. ej. "51987654321"
 */
const EVENTO = {
  organiza: "Asociación de Luriguayos Revelación Fanáticos Juli",
  tipo: "Recepción",
  mensaje: "Será un honor compartir contigo una velada de música, danza y tradición. ¡Acompáñanos!",
  fecha: "2026-11-23",
  hora: "",
  duracionHoras: 5,
  lugar: "Salón de Eventos Enmanuel",
  direccion: "Juli, Puno",
  ubicacion: [-16.212889, -69.461351],
  whatsapp: "",
};

(() => {
  const G = window.gsap;
  const { ESQUEMAS, clamp, mapearTono, mulberry32, hslAHex, hexAHsl } = window.Motor;
  const ESCENA = window.ESCENA;
  const NS = "http://www.w3.org/2000/svg";
  const params = new URLSearchParams(location.search);
  const sinAnimacion = params.has("sinanim") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- datos ---------- */
  // fecha y hora en hora local (new Date("AAAA-MM-DD") la tomaría como UTC y
  // en Perú mostraría el día anterior)
  const [anio, mes, dia] = (EVENTO.fecha || "").split("-").map(Number);
  const [hh, mm] = (EVENTO.hora || "").split(":").map(Number);
  const conHora = !!EVENTO.hora && !isNaN(hh);
  const fecha = anio ? new Date(anio, mes - 1, dia, conHora ? hh : 0, conHora ? mm || 0 : 0) : null;
  const fechaValida = fecha && !isNaN(fecha);
  const [lat, lng] = EVENTO.ubicacion || [];
  const coords = lat != null && lng != null ? `${lat},${lng}` : "";

  function rellenar() {
    $$("[data-evento]").forEach((n) => {
      const v = EVENTO[n.dataset.evento];
      n.textContent = v || (n.dataset.evento === "direccion" ? "" : "Por confirmar");
      if (!v) n.classList.add("pendiente");
    });
    if (fechaValida) {
      // en la franja: "lunes · 2026" (el día y el mes van en grande)
      $("#d-fecha").textContent = `${fecha.toLocaleDateString("es-PE", { weekday: "long" })} · ${fecha.getFullYear()}`;
      $("#d-dia").textContent = fecha.getDate();
      $("#d-mes-largo").textContent = fecha.toLocaleDateString("es-PE", { month: "long" });
      $("#d-mes").textContent = fecha.toLocaleDateString("es-PE", { month: "short" }).replace(".", "").toUpperCase();
      if (conHora) $("#d-hora").textContent = fecha.toLocaleTimeString("es-PE", { hour: "numeric", minute: "2-digit" });
      else { $("#d-hora").textContent = "Por confirmar"; $("#d-hora").classList.add("pendiente"); }
    } else {
      ["#d-fecha", "#d-hora"].forEach((s) => { $(s).textContent = "Por confirmar"; $(s).classList.add("pendiente"); });
    }

    // título del afiche: cada letra de un color y ligeramente inclinada
    const COLORES_TITULO = ["#8338ec", "#f72585", "#ffbe0b", "#3a86ff", "#8ac926", "#fb5607", "#06d6a0"];
    const ev = $(".evento");
    const palabra = ev.textContent;
    ev.setAttribute("aria-label", palabra);
    ev.innerHTML = [...palabra].map((l, i) =>
      `<span class="letra" aria-hidden="true" style="color:${COLORES_TITULO[i % COLORES_TITULO.length]};--r:${(i % 2 ? 1 : -1) * (3 + (i * 7) % 6)}deg">${l}</span>`).join("");

    // mapa de Google con el punto del local y botón de ruta
    if (coords) {
      $("#mapa-iframe").src = `https://maps.google.com/maps?q=${coords}&z=17&hl=es&output=embed`;
      $("#btn-como-llegar").href = `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=driving`;
      $("#btn-mapa").href = `https://www.google.com/maps/search/?api=1&query=${coords}`;
      $("#btn-mapa").textContent = "Ver en el mapa ↓";
      $("#btn-mapa").addEventListener("click", (e) => {
        e.preventDefault();
        $("#ubicacion").scrollIntoView({ behavior: "smooth", block: "center" });
      });
      if (!EVENTO.lugar) { $("[data-evento=lugar]").textContent = "Ubicación en el mapa"; $("[data-evento=lugar]").classList.remove("pendiente"); }
    } else {
      $("#ubicacion").hidden = true;
      $("#btn-mapa").hidden = true;
    }

    const confirmar = $("#btn-confirmar");
    if (EVENTO.whatsapp) {
      const texto = `¡Hola! Confirmo mi asistencia a la ${EVENTO.tipo.toLowerCase()} de la ${EVENTO.organiza}.`;
      confirmar.href = `https://wa.me/${EVENTO.whatsapp}?text=${encodeURIComponent(texto)}`;
    } else {
      confirmar.setAttribute("aria-disabled", "true");
      confirmar.addEventListener("click", (e) => { e.preventDefault(); aviso("La confirmación se habilitará pronto"); });
    }
  }

  /* ---------- cuenta regresiva ---------- */
  function cuentaRegresiva() {
    if (!fechaValida || fecha < new Date()) return;
    $("#cuenta").hidden = false;
    const pad = (n) => String(n).padStart(2, "0");
    const tic = () => {
      let s = Math.max(0, Math.floor((fecha - new Date()) / 1000));
      const d = Math.floor(s / 86400); s %= 86400;
      const h = Math.floor(s / 3600); s %= 3600;
      const m = Math.floor(s / 60); s %= 60;
      $("#c-dias").textContent = d;
      $("#c-horas").textContent = pad(h);
      $("#c-min").textContent = pad(m);
      $("#c-seg").textContent = pad(s);
    };
    tic();
    setInterval(tic, 1000);
  }

  /* ---------- calendario (.ics) y compartir ---------- */
  function agregarCalendario() {
    if (!fechaValida) { aviso("La fecha aún está por confirmar"); return; }
    const fin = new Date(fecha.getTime() + EVENTO.duracionHoras * 3600e3);
    const f = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const soloDia = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const manana = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
    const esc = (t) => (t || "").replace(/[,;\\]/g, (c) => "\\" + c);
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Luriguayos//Invitacion//ES", "BEGIN:VEVENT",
      `UID:${f(fecha)}-luriguayos@invitacion`, `DTSTAMP:${f(new Date())}`,
      // sin hora confirmada: evento de todo el día
      ...(conHora ? [`DTSTART:${f(fecha)}`, `DTEND:${f(fin)}`]
        : [`DTSTART;VALUE=DATE:${soloDia(fecha)}`, `DTEND;VALUE=DATE:${soloDia(manana)}`]),
      `SUMMARY:${esc(`${EVENTO.tipo} · ${EVENTO.organiza}`)}`,
      `LOCATION:${esc([EVENTO.lugar, EVENTO.direccion].filter(Boolean).join(", "))}`,
      ...(coords ? [`GEO:${lat};${lng}`] : []),
      `DESCRIPTION:${esc(EVENTO.mensaje)}`, "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "recepcion-luriguayos.ics";
    a.click();
  }

  async function compartir() {
    const datos = { title: `${EVENTO.tipo} · Luriguayos`, text: `${EVENTO.organiza} te invita a su ${EVENTO.tipo.toLowerCase()}.`, url: location.href.split("?")[0] };
    try {
      if (navigator.share) await navigator.share(datos);
      else { await navigator.clipboard.writeText(datos.url); aviso("Enlace copiado"); }
    } catch { /* el usuario canceló */ }
  }

  /* ---------- pareja de danzantes ---------- */
  const prendas = [];

  /* Cada prenda es su propio <svg> superpuesto. Así se anima moviendo la capa
   * entera (el navegador la desplaza ya dibujada) y no se redibujan miles de
   * trazados en cada cuadro, que es lo que congelaba la página. */
  const VISTA = [110, 0, 1230, 1090]; // recorte de la escena: x, y, ancho, alto
  function capaSvg(clase) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", VISTA.join(" "));
    s.setAttribute("class", `capa ${clase}`);
    s.setAttribute("aria-hidden", "true");
    $("#lienzo").appendChild(s);
    return s;
  }
  // centro de la prenda en % de la capa (origen de giros y escalas)
  const origen = ([x, y]) => `${((x - VISTA[0]) / VISTA[2]) * 100}% ${((y - VISTA[1]) / VISTA[3]) * 100}%`;

  /* ---------- ropa casual (antes del traje) ----------
   * Mismas formas que el traje, un color por prenda con 4 tonos de sombra. */
  const CASUAL_COLORES = {
    polo: ["#ffffff", "#f4f1ea", "#e86a8a", "#7bb7e0", "#ffd166", "#a78bfa", "#2b2b2b", "#2e9e8f", "#e76f51", "#3d5a80"],
    jean: ["#35507e", "#2b3a55", "#4a6fa5", "#5b7db1"],
  };
  const LUZ_NIVEL = [-0.13, 0, 0.05, 0.09]; // sombra, base, -, luz
  const casual = [];
  const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

  // las capas casuales van debajo del cuerpo (manos y cara quedan encima)
  function construirCasual(antesDe) {
    const jean = hexAHsl(azar(CASUAL_COLORES.jean));
    (ESCENA.casual || []).forEach((c) => {
      const capa = capaSvg("capa-casual");
      $("#lienzo").insertBefore(capa, antesDe);
      const exacto = c.color === "cabello" ? ESCENA.cabello.color : c.color === "piel" ? ESCENA.silueta.color : null;
      const base = c.color === "jean" ? jean : hexAHsl(azar(CASUAL_COLORES.polo));
      c.tonos.forEach((t) => {
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", t.d);
        path.setAttribute("fill", exacto || hslAHex(base.h, base.s, clamp(base.l + LUZ_NIVEL[t.nivel], 0.04, 0.97)));
        capa.appendChild(path);
      });
      casual.push({ capa, reemplaza: c.reemplaza });
    });
  }

  function construirPareja() {
    if (!ESCENA) return;
    const cuerpo = capaSvg("capa-cuerpo");
    cuerpo.insertAdjacentHTML("beforeend",
      '<defs><radialGradient id="grad-sombra"><stop offset="0" stop-color="#2b1208" stop-opacity=".45"/>'
      + '<stop offset="1" stop-color="#2b1208" stop-opacity="0"/></radialGradient></defs>'
      + '<ellipse cx="760" cy="1066" rx="600" ry="34" fill="url(#grad-sombra)"/>');
    const g = document.createElementNS(NS, "g");
    cuerpo.appendChild(g);
    Silueta.dibujar(g, ESCENA);
    construirCasual(cuerpo);
    ESCENA.prendas.forEach((p) => {
      const capa = capaSvg("capa-prenda");
      const paths = {};
      p.tonos.forEach((t) => {
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", t.d);
        path.setAttribute("fill", t.color);
        capa.appendChild(paths[t.id] = path);
      });
      const [x1, y1, x2, y2] = p.caja;
      // sandalias y borla se ven desde el inicio (cubren pies y mano)
      const fija = /sandalias|borla/.test(p.id);
      prendas.push({ pieza: p, paths, capa, fija, origen: origen([(x1 + x2) / 2, (y1 + y2) / 2]) });
    });
  }

  // colores nuevos para el atuendo en cada visita o toque: armonía al azar;
  // las prendas blancas se respetan y las sandalias toman tonos oscuros
  function colorear(semilla, animar = true) {
    const rnd = mulberry32(semilla);
    const nombres = Object.keys(ESQUEMAS);
    const offs = ESQUEMAS[nombres[Math.floor(rnd() * nombres.length)]];
    const base = rnd() * 360;
    prendas.forEach((st, i) => {
      const sandalia = /sandalias/.test(st.pieza.id);
      const roles = {};
      st.pieza.roles
        // las chompas, la pollera y el pantalón son siempre blancos
        .filter((r) => !r.fijo && r.rol !== "blanco" && !(st.pieza.blanca && r.rol === "tela"))
        .forEach((r, j) => {
          roles[r.rol] = {
            h: base + i * 47 + offs[j % offs.length] + (rnd() - 0.5) * 20,
            s: 0.6 + rnd() * 0.35,
            l: sandalia ? 0.18 + rnd() * 0.15
              : r.rol === "gris" ? r.l
              : clamp(r.l + (rnd() - 0.5) * 0.2, 0.25, 0.65),
          };
        });
      const pintar = () => st.pieza.tonos.forEach((t) => {
        const obj = roles[t.rol];
        st.paths[t.id].setAttribute("fill",
          obj ? mapearTono(t, st.pieza.roles.find((r) => r.rol === t.rol), obj) : t.color);
      });
      // cada prenda cambia de golpe (un solo redibujo), una tras otra, con un "pop"
      if (G && animar && !sinAnimacion) {
        G.delayedCall(i * 0.05, () => {
          pintar();
          G.fromTo(st.capa, { scale: 1.035 }, { scale: 1, transformOrigin: st.origen, duration: 0.45, ease: "back.out(3)" });
        });
      } else {
        pintar();
      }
    });
  }

  /* ---------- música: empieza bajito y sube poco a poco ---------- */
  const VOLUMEN_FINAL = 0.8;
  const SUBIDA_SEG = 8;
  const musica = $("#musica");
  const btnMusica = $("#btn-musica");
  const vol = { v: 0 };
  let fundido = null;
  let ganancia = null; // Web Audio: único modo de bajar el volumen en iPhone

  // iOS Safari ignora audio.volume; con un GainNode el fundido funciona en todos.
  // Desde file:// el navegador silenciaría el nodo, ahí se usa audio.volume.
  function prepararGanancia() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (ganancia || !Ctx || location.protocol === "file:") return;
    try {
      const ctx = new Ctx();
      ganancia = ctx.createGain();
      ganancia.gain.value = 0;
      ctx.createMediaElementSource(musica).connect(ganancia).connect(ctx.destination);
      ganancia.ctx = ctx;
    } catch { ganancia = null; }
  }
  function aplicarVolumen(v) {
    if (ganancia) ganancia.gain.value = v; else musica.volume = v;
  }

  function fundirA(destino, segundos, alTerminar) {
    clearInterval(fundido);
    const inicio = vol.v, t0 = performance.now();
    fundido = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / (segundos * 1000));
      vol.v = inicio + (destino - inicio) * k * k; // curva suave: sube despacio al inicio
      aplicarVolumen(vol.v);
      if (k >= 1) { clearInterval(fundido); if (alTerminar) alTerminar(); }
    }, 50);
  }

  // debe llamarse desde un toque (los celulares bloquean el audio sin gesto)
  function iniciarMusica() {
    prepararGanancia();
    if (ganancia) ganancia.ctx.resume();
    vol.v = 0;
    aplicarVolumen(0);
    musica.play().then(() => {
      btnMusica.hidden = false;
      fundirA(VOLUMEN_FINAL, SUBIDA_SEG);
    }).catch(() => { btnMusica.hidden = false; btnMusica.classList.add("mudo"); });
  }

  btnMusica.addEventListener("click", () => {
    if (musica.paused) {
      musica.play();
      btnMusica.classList.remove("mudo");
      btnMusica.setAttribute("aria-label", "Silenciar música");
      fundirA(VOLUMEN_FINAL, 2);
    } else {
      btnMusica.classList.add("mudo");
      btnMusica.setAttribute("aria-label", "Activar música");
      fundirA(0, 0.6, () => musica.pause());
    }
  });
  // al salir de la app se pausa; al volver se retoma con un fundido corto
  document.addEventListener("visibilitychange", () => {
    if (btnMusica.hidden || btnMusica.classList.contains("mudo")) return;
    if (document.hidden) musica.pause();
    else { vol.v = 0; aplicarVolumen(0); musica.play().then(() => fundirA(VOLUMEN_FINAL, 2)).catch(() => {}); }
  });

  /* ---------- colores que se alternan solos ---------- */
  const CADA_MS = 3000;
  let reloj = null;
  function alternarColores() {
    if (sinAnimacion) return;
    clearInterval(reloj);
    reloj = setInterval(() => {
      if (!document.hidden) colorear(Math.floor(Math.random() * 1e6));
    }, CADA_MS);
  }

  /* ---------- carnaval: guirnalda, globos y espuma ---------- */
  let carnavalListo = false;
  function iniciarCarnaval() {
    if (carnavalListo || !window.Carnaval) return;
    carnavalListo = true;
    Carnaval.guirnalda($(".hero"));
    Carnaval.globos(6);
    const btn = $("#btn-espuma");
    btn.hidden = false;
    if (G && !sinAnimacion) G.from(btn, { scale: 0, duration: 0.5, ease: "back.out(2.5)", delay: 1.2 });
    btn.addEventListener("click", () => {
      const r = btn.getBoundingClientRect();
      Carnaval.espuma(r.left + r.width / 2, r.top, -1);
      if (G) G.fromTo(btn, { rotation: -20 }, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    });
  }

  /* ---------- pompones de fondo ---------- */
  function pompones() {
    if (!G || sinAnimacion) return;
    const cont = $("#pompones");
    const colores = ["#c8102e", "#f2b705", "#e5197e", "#1f9d55", "#1d4fbf", "#ff7a00", "#8e24aa"];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement("span");
      p.className = "pompon";
      const t = G.utils.random(14, 34);
      Object.assign(p.style, { width: `${t}px`, height: `${t}px`, left: `${G.utils.random(0, 100)}%`, top: "105%" });
      p.style.setProperty("--c", colores[i % colores.length]);
      cont.appendChild(p);
      G.to(p, {
        y: () => -(innerHeight + 160), x: () => G.utils.random(-60, 60), rotation: G.utils.random(-180, 180),
        duration: G.utils.random(9, 16), repeat: -1, delay: G.utils.random(0, 10), ease: "none",
      });
    }
  }

  /* lluvia de pompones al abrir el sobre */
  function estallido() {
    if (!G || sinAnimacion) return;
    const colores = ["#c8102e", "#f2b705", "#e5197e", "#1f9d55", "#1d4fbf", "#ff7a00"];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement("span");
      p.className = "pompon";
      const t = G.utils.random(10, 22);
      Object.assign(p.style, { width: `${t}px`, height: `${t}px`, left: "50%", top: "45%", zIndex: 25, position: "fixed" });
      p.style.setProperty("--c", colores[i % colores.length]);
      document.body.appendChild(p);
      const ang = G.utils.random(0, Math.PI * 2), r = G.utils.random(120, 260);
      G.timeline({ onComplete: () => p.remove() })
        .to(p, { x: Math.cos(ang) * r, y: Math.sin(ang) * r - 60, duration: 0.7, ease: "power3.out" })
        .to(p, { y: `+=${G.utils.random(300, 600)}`, opacity: 0, rotation: G.utils.random(-200, 200), duration: 1.4, ease: "power1.in" });
    }
  }

  /* ---------- animaciones ---------- */
  let abierto = false;
  function abrirSobre() {
    if (abierto) return;
    abierto = true;
    iniciarMusica();
    const sobre = $("#sobre");
    const mostrar = () => { document.body.classList.remove("cerrado"); $("#invitacion").setAttribute("aria-hidden", "false"); };
    if (!G || sinAnimacion) { mostrar(); iniciarCarnaval(); sobre.remove(); $$(".capa-casual").forEach((c) => (c.style.display = "none")); colorear(semillaInicial, false); revelarTodo(); return; }
    G.timeline()
      .to(".sello", { scale: 1.25, duration: 0.15, ease: "power1.out" })
      .to(".sello", { scale: 0, rotation: 200, opacity: 0, duration: 0.35, ease: "back.in(2)" })
      .to(".solapa", { scaleY: -1, duration: 0.5, ease: "power2.inOut" }, "-=0.1")
      .add(estallido, "-=0.2")
      .add(() => window.Carnaval && Carnaval.lluvia(10), "<")
      .to(".sobre-cuerpo", { y: "70vh", rotation: 6, opacity: 0, duration: 0.7, ease: "power2.in" }, "+=0.05")
      .to(sobre, { opacity: 0, duration: 0.4, onComplete: () => sobre.remove() }, "-=0.3")
      .add(() => { mostrar(); entradaInvitacion(); }, "-=0.4");
  }

  function entradaInvitacion() {
    iniciarCarnaval();
    const tl = G.timeline();
    // 1) el escenario y el arco de Juli, que se levanta piedra a piedra
    tl.from(".aguayo", { scaleX: 0, transformOrigin: "left center", duration: 0.6, ease: "power2.out" })
      .from("#img-fondo", { opacity: 0, scale: 1.06, duration: 0.9, ease: "power1.out" }, "<")
      // el arco se levanta desde la base
      .from("#img-arco", { y: 80, opacity: 0, scale: 0.94, transformOrigin: "50% 70%", duration: 1.2, ease: "power3.out" }, "-=0.4")
      // 2) el título sobre el cielo
      .from(".kicker", { y: 20, opacity: 0, duration: 0.4 }, "-=0.4")
      .from(".titulo", { y: 40, opacity: 0, scale: 0.9, duration: 0.7, ease: "back.out(1.7)" }, "-=0.2")
      .from(".subtitulo", { scale: 0, duration: 0.45, ease: "back.out(2.5)" }, "-=0.3")
      .from(".letra", { y: -60, opacity: 0, scale: 0.3, rotation: () => G.utils.random(-40, 40),
        duration: 0.6, ease: "back.out(2.2)", stagger: 0.06 }, "-=0.2")
      .from(".lema", { opacity: 0, y: 10, duration: 0.4 }, "-=0.2")
      .from(".inst", { scale: 0, opacity: 0, rotation: () => G.utils.random(-30, 30), duration: 0.7,
        ease: "back.out(1.8)", stagger: 0.08 }, "-=0.6")
      // 3) los danzantes llegan con ropa casual
      .from([...$$(".capa-cuerpo, .capa-casual"), ...prendas.filter((p) => p.fija).map((p) => p.capa)],
        { opacity: 0, y: 40, duration: 0.7, ease: "power2.out" }, "-=0.2")
      // 4) cambio de vestuario: el traje cae pieza por pieza sobre la ropa casual
      .fromTo("#cambio", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, "+=1.1")
      .add(() => window.Carnaval && Carnaval.lluvia(14), "-=0.2")
      .to("#cambio", { opacity: 0, y: -14, duration: 0.35 }, "+=0.7");
    const sueltas = prendas.filter((p) => !p.fija);
    sueltas.sort((a, b) => b.pieza.caja[3] - a.pieza.caja[3]).forEach((st, i) => {
      tl.from(st.capa, { y: -90, opacity: 0, scale: 0.85, transformOrigin: st.origen,
        duration: 0.55, ease: "back.out(1.6)" }, i === 0 ? "-=0.3" : "-=0.42");
      const reemplazadas = casual.filter((c) => c.reemplaza === st.pieza.id).map((c) => c.capa);
      if (reemplazadas.length) tl.to(reemplazadas, { opacity: 0, duration: 0.3 }, "-=0.25");
    });
    // ya tapada por el traje, la ropa casual se retira (menos que dibujar)
    tl.set(".capa-casual", { display: "none" });
    tl.add(() => { colorear(semillaInicial); alternarColores(); }, "-=0.2")
      .from(".pareja-pista", { opacity: 0, y: 10, duration: 0.4 });
    tl.add(() => {
      G.to(".pareja", { y: -6, duration: 1.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
      // instrumentos que se mecen y el bombo que late al ritmo
      $$(".inst").forEach((n) => G.to(n, { rotation: `+=${G.utils.random(-6, 6)}`, y: G.utils.random(-6, 6),
        duration: G.utils.random(1.6, 2.6), yoyo: true, repeat: -1, ease: "sine.inOut" }));
      G.to(".deco-bombo, .deco-tinya", { scale: 1.06, duration: 0.23, yoyo: true, repeat: -1, ease: "power1.inOut",
        repeatDelay: 0.24 });
      G.to(".letra", { y: -4, duration: 0.5, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: { each: 0.08, repeat: -1, yoyo: true } });

    });
    revelarAlBajar();
  }

  function revelarAlBajar() {
    if (!window.ScrollTrigger) return revelarTodo();
    G.registerPlugin(ScrollTrigger);
    $$(".revelar").forEach((n) => {
      G.from(n, { y: 40, opacity: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: n, start: "top 92%" } });
    });
  }

  function revelarTodo() { /* sin animación: todo visible desde el inicio */ }

  function aviso(txt) {
    const t = $("#toast");
    t.textContent = txt;
    if (!G) return;
    G.killTweensOf(t);
    G.timeline().to(t, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(2)" })
      .to(t, { y: 30, opacity: 0, duration: 0.3, delay: 1.8 });
  }

  /* ---------- arranque ---------- */
  const semillaInicial = Math.floor(Math.random() * 1e6);

  rellenar();
  construirPareja();
  cuentaRegresiva();
  if (G) G.set("#toast", { xPercent: -50, y: 30 });

  $("#btn-calendario").addEventListener("click", agregarCalendario);
  $("#btn-compartir").addEventListener("click", compartir);
  $("#pareja").addEventListener("click", () => {
    colorear(Math.floor(Math.random() * 1e6));
    alternarColores(); // el toque reinicia el ciclo de 3 s
    if (G && !sinAnimacion) G.fromTo(".pareja", { scale: 0.97 }, { scale: 1, transformOrigin: "50% 100%", duration: 0.6, ease: "elastic.out(1, 0.4)" });
  });
  pompones();

  // ?directo salta el sobre (útil para compartir o revisar)
  if (params.has("sinanim")) {
    abrirSobre();
  } else if (params.has("directo")) {
    // sin sobre: la entrada empieza de inmediato (la música necesita un toque:
    // queda el botón para activarla)
    abierto = true;
    $("#sobre").remove();
    document.body.classList.remove("cerrado");
    $("#invitacion").setAttribute("aria-hidden", "false");
    btnMusica.hidden = false;
    btnMusica.classList.add("mudo");
    if (G) entradaInvitacion(); else colorear(semillaInicial, false);
  } else {
    $("#sobre").addEventListener("click", abrirSobre);
    if (G) {
      G.from(".sobre-cuerpo", { y: 80, opacity: 0, rotation: -4, duration: 0.8, ease: "back.out(1.5)" });
      G.to(".sello", { scale: 1.08, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }
  }
})();
