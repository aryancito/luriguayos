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
  hora: "17:00",
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
  // la historia del cambio de vestuario se cuenta siempre; con "reducir
  // movimiento" en el celular las prendas aparecen con fundido, sin volar
  const sinAnimacion = params.has("sinanim");
  const suave = matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  function capaSvg(clase, cont = $("#lienzo")) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", VISTA.join(" "));
    s.setAttribute("class", `capa ${clase}`);
    s.setAttribute("aria-hidden", "true");
    cont.appendChild(s);
    return s;
  }
  // punto de la escena -> % de la capa
  const pct = ([x, y]) => [((x - VISTA[0]) / VISTA[2]) * 100, ((y - VISTA[1]) / VISTA[3]) * 100];

  /* Cada danzante es un grupo propio (para animarlos por separado). El cuerpo
   * de ambos viene en una sola forma: se recorta por esta línea, que pasa entre
   * los dos sin cortar los brazos que se juntan en el pompón. */
  const CORTE_ELLA = [[0, 0], [568, 0], [568, 66], [592, 96], [625, 108], [650, 160], [700, 280], [870, 560], [870, 1090], [0, 1090]];
  const figuras = {};
  const ROSAS = [352, 86, 112, 86]; // x, y, ancho, alto en la escena (sobre la montera)
  function grupoFigura(fig) {
    const d = document.createElement("div");
    d.className = `figura figura-${fig}`;
    $("#lienzo").appendChild(d);
    figuras[fig] = { el: d, casual: [], prendas: [] };
    return figuras[fig];
  }
  // centro de la prenda en % de la capa (origen de giros y escalas)
  const origen = ([x, y]) => `${((x - VISTA[0]) / VISTA[2]) * 100}% ${((y - VISTA[1]) / VISTA[3]) * 100}%`;

  /* ---------- ropa casual (antes del traje) ----------
   * Mismas formas que el traje, un color por prenda con 4 tonos de sombra. */
  const CASUAL_COLORES = {
    polo: ["#ffffff", "#f4f1ea", "#e86a8a", "#7bb7e0", "#ffd166", "#a78bfa", "#2b2b2b", "#2e9e8f", "#e76f51", "#3d5a80"],
    jean: ["#35507e", "#2b3a55", "#4a6fa5", "#5b7db1"],
  };
  const LUZ_NIVEL = [-0.2, 0, -0.08, 0.08]; // pliegue, base, sombra suave, luz (nivel 4: costura)
  const casual = [];
  const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

  // las capas casuales van debajo del cuerpo (manos y cara quedan encima)
  function construirCasual(cuerpos) {
    const ultimaEncima = { ...cuerpos };
    const jean = hexAHsl(azar(CASUAL_COLORES.jean));
    const colorPolo = {};
    (ESCENA.casual || []).forEach((c) => {
      const cuerpo = cuerpos[c.figura];
      const capa = capaSvg("capa-casual", figuras[c.figura].el);
      // cabello y orejas van encima del rostro; la ropa, debajo del cuerpo
      if (c.encima) { ultimaEncima[c.figura].after(capa); ultimaEncima[c.figura] = capa; }
      else figuras[c.figura].el.insertBefore(capa, cuerpo);
      const piel = hexAHsl(ESCENA.silueta.color);
      const exacto = c.color === "cabello" ? ESCENA.cabello.color
        : c.color === "piel" ? ESCENA.silueta.color
        : c.color === "sombra" ? hslAHex(piel.h, piel.s, piel.l * 0.78)
        : c.color === "oro" ? "#f2b705" : null;
      // la blusa/polo y su faldón comparten color (uno por danzante)
      colorPolo[c.figura] ||= hexAHsl(azar(CASUAL_COLORES.polo));
      const base = c.color === "jean" ? jean : colorPolo[c.figura];
      c.tonos.forEach((t) => {
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", t.d);
        // tonos claros (blanco/crema) oscurecen menos; la costura del jean es dorada
        const factor = base.l > 0.85 ? 0.55 : 1;
        path.setAttribute("fill", exacto || (t.nivel === 4 ? "#d9a441"
          : hslAHex(base.h, base.s, clamp(base.l + LUZ_NIVEL[t.nivel] * factor, 0.04, 0.97))));
        capa.appendChild(path);
      });
      casual.push({ capa, reemplaza: c.reemplaza });
      figuras[c.figura].casual.push(capa);
    });
  }

  function construirPareja() {
    if (!ESCENA) return;
    // sombra en el piso (común a los dos)
    capaSvg("capa-sombra").innerHTML =
      '<defs><radialGradient id="grad-sombra"><stop offset="0" stop-color="#2b1208" stop-opacity=".45"/>'
      + '<stop offset="1" stop-color="#2b1208" stop-opacity="0"/></radialGradient></defs>'
      + '<ellipse cx="760" cy="1066" rx="600" ry="34" fill="url(#grad-sombra)"/>';
    const cuerpos = {};
    const recorte = CORTE_ELLA.map((p) => pct(p).map((v) => `${v}%`).join(" ")).join(", ");
    ["mujer", "varon"].forEach((fig) => {
      const grupo = grupoFigura(fig);
      const cuerpo = capaSvg("capa-cuerpo", grupo.el);
      const g = document.createElementNS(NS, "g");
      cuerpo.appendChild(g);
      Silueta.dibujar(g, ESCENA);
      // ella: dentro del polígono; él: el resto (polígono invertido con evenodd)
      cuerpo.style.clipPath = fig === "mujer" ? `polygon(${recorte})`
        : `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${recorte})`;
      cuerpos[fig] = cuerpo;
    });
    construirCasual(cuerpos);
    // silueta luminosa de ella para la transformación: blanca y estática
    const luz = capaSvg("capa-luz", figuras.mujer.el);
    luz.style.clipPath = cuerpos.mujer.style.clipPath;
    luz.innerHTML = [ESCENA.silueta.d, ESCENA.cabello.d,
      ...(ESCENA.casual || []).filter((c) => c.figura === "mujer").flatMap((c) => c.tonos.map((t) => t.d))]
      .map((d) => `<path d="${d}" fill="#fff"/>`).join("");
    figuras.mujer.luz = luz;
    // rosas rojas de la montera (llegan volando al final)
    const rosas = capaSvg("capa-rosas", figuras.mujer.el);
    rosas.innerHTML = `<image href="img/rosas.svg" x="${ROSAS[0]}" y="${ROSAS[1]}" width="${ROSAS[2]}" height="${ROSAS[3]}"/>`;
    figuras.mujer.rosas = rosas;
    ESCENA.prendas.forEach((p) => {
      const capa = capaSvg("capa-prenda", figuras[p.figura].el);
      const paths = {};
      p.tonos.forEach((t) => {
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", t.d);
        path.setAttribute("fill", t.color);
        capa.appendChild(paths[t.id] = path);
      });
      const [x1, y1, x2, y2] = p.caja;
      // las sandalias se ven desde el inicio (cubren los pies); el pompón
      // (borla) aparece recién al final del "modo luriguayo"
      const fija = /sandalias/.test(p.id);
      const st = { pieza: p, paths, capa, fija, origen: origen([(x1 + x2) / 2, (y1 + y2) / 2]) };
      prendas.push(st);
      figuras[p.figura].prendas.push(st);
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
      btnMusica.setAttribute("aria-label", "Pausar música");
      fundirA(VOLUMEN_FINAL, 2);
    } else {
      btnMusica.classList.add("mudo");
      btnMusica.setAttribute("aria-label", "Reproducir música");
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
    // espuma de carnaval que sale sola, de cuando en vez, en cualquier parte
    if (!sinAnimacion) {
      const rociar = () => {
        if (!document.hidden) {
          const x = innerWidth * (0.1 + Math.random() * 0.8);
          const y = innerHeight * (0.45 + Math.random() * 0.5);
          Carnaval.espuma(x, y, Math.random() < 0.5 ? -1 : 1);
        }
        setTimeout(rociar, 7000 + Math.random() * 7000);
      };
      setTimeout(rociar, 5000);
    }
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
    if (!G || sinAnimacion) { window.__arcoEntrada(); mostrar(); $$(".capa-rosas").forEach((r) => (r.style.opacity = 1)); iniciarCarnaval(); sobre.remove(); $$(".capa-casual").forEach((c) => (c.style.display = "none")); colorear(semillaInicial, false); revelarTodo(); return; }
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

  /* ---------- cambio de vestuario ---------- */
  const CENTRO_ELLA = [490, 560];
  const enPantalla = ([x, y]) => {            // punto de la escena -> píxeles de la pantalla
    const r = $("#lienzo").getBoundingClientRect(), [px, py] = pct([x, y]);
    return [r.left + r.width * px / 100, r.top + r.height * py / 100];
  };
  const chispas = (punto, n = 14) => {
    if (!window.Carnaval) return;
    const [x, y] = enPantalla(punto);
    Carnaval.picado(x, y, n, ["#ffffff", "#ffd23f", "#f72585", "#3a86ff", "#8ac926"]);
  };
  const casualDe = (id) => casual.filter((c) => c.reemplaza === id).map((c) => c.capa);
  const centro = (st) => [(st.pieza.caja[0] + st.pieza.caja[2]) / 2, (st.pieza.caja[1] + st.pieza.caja[3]) / 2];

  // ella: transformación estilo Sailor Moon
  function transformarElla(tl) {
    const ella = figuras.mujer;
    const suyas = ella.prendas.filter((p) => !p.fija && !/borla/.test(p.pieza.id)).sort((a, b) => b.pieza.caja[3] - a.pieza.caja[3]);
    const [ox, oy] = pct(CENTRO_ELLA);
    if (suave) {  // con "reducir movimiento": fundido sencillo
      tl.to(ella.casual, { opacity: 0, duration: 0.6 }).to(suyas.map((p) => p.capa), { opacity: 1, duration: 0.6 }, "<");
      return;
    }
    tl.addLabel("ella")
      .to(".pareja", { scale: 1.55, transformOrigin: `${ox}% ${oy}%`, duration: 0.8, ease: "power2.inOut" }, "ella")
      .to(".transfo", { opacity: 1, duration: 0.8 }, "ella")
      // silueta luminosa que gira
      .to(ella.luz, { opacity: 1, duration: 0.35 }, "ella+=0.5")
      .to(ella.el, { scaleX: -1, transformOrigin: `${ox}% ${oy}%`, duration: 0.22, ease: "sine.inOut",
        yoyo: true, repeat: 3 }, "ella+=0.6")
      // destello: se apaga la luz y aparece vestida, prenda por prenda, de los pies a la cabeza
      .to(ella.luz, { opacity: 0, duration: 0.25 }, "ella+=1.5")
      .fromTo(".destello", { opacity: 0.95 }, { opacity: 0, duration: 0.6, immediateRender: false }, "ella+=1.5")
      .fromTo(".anillo", { y: 0, opacity: 0 }, { y: -900, opacity: 1, duration: 1.4, ease: "power1.inOut",
        stagger: 0.18, immediateRender: false }, "ella+=1.5")
      .to(".anillo", { opacity: 0, duration: 0.3, stagger: 0.18 }, "ella+=2.6");
    suyas.forEach((st, i) => {
      // la prenda casual que esta cubre se va justo cuando aparece (nunca queda el cuerpo vacío)
      const cubre = casualDe(st.pieza.id);
      tl.fromTo(st.capa, { opacity: 0, scale: 1.3, transformOrigin: st.origen },
        { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)", immediateRender: false }, `ella+=${1.55 + i * 0.2}`)
        .add(() => chispas(centro(st), 10), "<");
      if (cubre.length) tl.set(cubre, { display: "none" }, "<+0.2");
    });
    tl.add(() => chispas(CENTRO_ELLA, 36), ">-0.1")
      .to(".pareja", { scale: 1, duration: 0.8, ease: "power2.inOut" }, "+=0.35")
      .to(".transfo", { opacity: 0, duration: 0.8 }, "<");
  }

  // rosas rojas: cruzan toda la pantalla en curva y se posan en la montera
  function vuelanRosas(tl) {
    const destino = figuras.mujer.rosas;
    if (suave) { tl.to(destino, { opacity: 1, duration: 0.6 }); return; }
    const vuela = document.createElement("img");
    vuela.src = "img/rosas.svg";
    vuela.className = "rosas-vuelan";
    vuela.alt = "";
    document.body.appendChild(vuela);
    tl.add(() => {
      const r = $("#lienzo").getBoundingClientRect();
      const ancho = r.width * ROSAS[2] / VISTA[2];
      const [fx, fy] = enPantalla([ROSAS[0], ROSAS[1]]);
      const W = innerWidth, H = innerHeight;
      G.set(vuela, { width: ancho, x: -ancho * 2, y: H * 0.85, rotation: -40, scale: 4.2, opacity: 1 });
      // recorrido: entra abajo-izquierda, cruza a la derecha, sube, vuelve y baja a la montera
      G.timeline({ onComplete: () => { vuela.remove(); } })
        .to(vuela, { keyframes: [
          { x: W * 0.75, y: H * 0.62, rotation: 120, scale: 3.8, duration: 0.8, ease: "sine.inOut" },
          { x: W * 0.62, y: H * 0.12, rotation: 260, scale: 3.2, duration: 0.7, ease: "sine.inOut" },
          { x: W * 0.06, y: H * 0.3, rotation: 400, scale: 2.4, duration: 0.7, ease: "sine.inOut" },
          { x: fx, y: fy, rotation: 720, scale: 1, duration: 0.7, ease: "power2.out" },
        ] })
        .add(() => { chispas([ROSAS[0] + ROSAS[2] / 2, ROSAS[1] + ROSAS[3] / 2], 24); }, "-=0.05")
        .set(destino, { opacity: 1 })
        .set(vuela, { opacity: 0 })
        .fromTo(destino, { scale: 1.25, transformOrigin: origen([ROSAS[0] + ROSAS[2] / 2, ROSAS[1] + ROSAS[3]]) },
          { scale: 1, duration: 0.4, ease: "back.out(3)" });
      // pétalos que se desprenden por el camino
      for (let k = 0; k < 10; k++) G.delayedCall(0.25 * k, () => {
        const b = vuela.getBoundingClientRect();
        if (window.Carnaval && b.width) Carnaval.picado(b.left + b.width / 2, b.top + b.height / 2, 3, ["#e63946", "#c1121f", "#2d8a3e"]);
      });
    }, "+=0.2");
    tl.to({}, { duration: 3.2 }); // da tiempo al vuelo antes de seguir
  }

  // remate: el pompón aparece entre sus manos con un estallido
  function aparecePompon(tl) {
    const pompon = prendas.find((p) => /borla/.test(p.pieza.id));
    if (!pompon) return;
    if (suave) { tl.to(pompon.capa, { opacity: 1, duration: 0.6 }); return; }
    tl.fromTo(pompon.capa, { opacity: 0, scale: 0, rotation: -200, transformOrigin: pompon.origen },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.7, ease: "back.out(2.2)", immediateRender: false }, "+=0.15")
      .add(() => { chispas(centro(pompon), 40); window.Carnaval && Carnaval.lluvia(8); }, "-=0.3")
      .to(pompon.capa, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1 });
  }

  // él: sale corriendo por la derecha y vuelve de un salto, ya vestido
  function correrEl(tl) {
    const el = figuras.varon;
    const suyas = el.prendas.filter((p) => !p.fija).map((p) => p.capa);
    if (suave) {
      tl.to(el.casual, { opacity: 0, duration: 0.6 }).to(suyas, { opacity: 1, duration: 0.6 }, "<");
      return;
    }
    tl.addLabel("el", "+=0.2")
      .to(el.el, { rotation: 6, transformOrigin: "75% 95%", duration: 0.15 }, "el")
      .to(el.el, { xPercent: 75, duration: 0.5, ease: "power2.in" }, "el+=0.1")
      .add(() => chispas([1150, 600], 12), "el+=0.25")
      .set(el.casual, { display: "none" }, "el+=0.65")
      .set(suyas, { opacity: 1 }, "el+=0.65")
      .set(el.el, { rotation: -8 }, "el+=0.65")
      // regreso con salto
      .to(el.el, { xPercent: 0, duration: 0.6, ease: "power2.out" }, "el+=0.9")
      .to(el.el, { y: -60, duration: 0.3, ease: "power2.out" }, "el+=0.9")
      .to(el.el, { y: 0, rotation: 0, duration: 0.35, ease: "bounce.out" }, "el+=1.2")
      .add(() => chispas([1000, 1000], 30), "el+=1.45");
  }

  function entradaInvitacion() {
    iniciarCarnaval();
    const tl = G.timeline();
    // 1) el escenario y el arco de Juli, que se levanta piedra a piedra
    tl.from(".aguayo", { scaleX: 0, transformOrigin: "left center", duration: 0.6, ease: "power2.out" })
      .from("#img-fondo", { opacity: 0, scale: 1.06, duration: 0.9, ease: "power1.out" }, "<")
      // el arco se levanta desde la base
      .from("#img-arco, #img-arco-real", { y: 80, scale: 0.94, transformOrigin: "50% 70%", duration: 1.2, ease: "power3.out" }, "-=0.4")
      .from("#img-arco", { opacity: 0, duration: 1.2, ease: "power3.out" }, "<")
      .add(() => window.__arcoEntrada(), "-=0.2")
      // 2) el título sobre el cielo
      .from(".kicker", { y: 20, opacity: 0, duration: 0.4 }, "-=0.4")
      .from(".titulo", { y: 40, opacity: 0, scale: 0.9, duration: 0.7, ease: "back.out(1.7)" }, "-=0.2")
      .from(".subtitulo", { scale: 0, duration: 0.45, ease: "back.out(2.5)" }, "-=0.3")
      .from(".letra", { y: -60, opacity: 0, scale: 0.3, rotation: () => G.utils.random(-40, 40),
        duration: 0.6, ease: "back.out(2.2)", stagger: 0.06 }, "-=0.2")
      .from(".lema", { opacity: 0, y: 10, duration: 0.4 }, "-=0.2")
      .from(".inst", { scale: 0, opacity: 0, rotation: () => G.utils.random(-30, 30), duration: 0.7,
        ease: "back.out(1.8)", stagger: 0.08 }, "-=0.6")
      // 3) los danzantes llegan con ropa casual (el traje queda escondido)
      .set(prendas.filter((p) => !p.fija).map((p) => p.capa), { opacity: 0 }, 0)
      .from([...$$(".capa-sombra, .capa-cuerpo, .capa-casual"), ...prendas.filter((p) => p.fija).map((p) => p.capa)],
        { opacity: 0, y: 40, duration: 0.7, ease: "power2.out" }, "-=0.2")
      // 4) ¡Modo luriguayo!
      .fromTo("#cambio", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, "+=0.6")
      .add(() => window.Carnaval && Carnaval.lluvia(10), "-=0.2")
      .to("#cambio", { opacity: 0, y: -14, duration: 0.35 }, "+=0.6");
    transformarElla(tl);
    correrEl(tl);
    aparecePompon(tl);
    vuelanRosas(tl);
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

  // foto real del arco: se funde sobre el vectorial cuando ya está descargada
  // y cuando terminó la entrada del arco (antes no, para no tapar la animación)
  const arcoReal = $("#img-arco-real");
  let arcoListo = false, entradaLista = false;
  const mostrarArcoReal = () => { if (arcoListo && entradaLista) arcoReal.classList.add("visible"); };
  if (arcoReal.complete && arcoReal.naturalWidth) arcoListo = true;
  else arcoReal.addEventListener("load", () => { arcoListo = true; mostrarArcoReal(); });
  window.__arcoEntrada = () => { entradaLista = true; mostrarArcoReal(); };
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
    window.__abrir = abrirSobre;
    $("#sobre").addEventListener("click", abrirSobre);
    // si tocaron el sello mientras cargaba, se abre ya
    if (window.__tocado) { document.body.classList.remove("cargando"); abrirSobre(); }
    if (G) {
      G.to(".sello", { scale: 1.08, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }
  }
})();
