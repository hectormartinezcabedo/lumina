/* ==========================================================================
   dashboard.js — Renderizado dinámico de tarjetas + filtro en tiempo real
   Lee el array SERVICIOS (mockData.js) e inyecta las tarjetas en el DOM
   usando <template> + cloneNode. Filtra por texto y categoría al vuelo.
   ========================================================================== */

/* ---------- Fecha de hoy y saludo según la hora (siempre actuales) ---------- */
function updateTodayHeader() {
  const now = new Date();
  const dateEl = document.getElementById("today-date");
  if (dateEl) {
    // "12 de noviembre de 2026" → "12 De Noviembre De 2026" (mismo estilo que el diseño)
    const texto = now.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    dateEl.textContent = texto.replace(/(^|\s)(\p{L})/gu, (_m, sp, l) => sp + l.toUpperCase());
    const pad = (n) => String(n).padStart(2, "0");
    dateEl.dateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  const greetEl = document.getElementById("greeting");
  if (greetEl) {
    const h = now.getHours();
    greetEl.textContent = h >= 6 && h < 14 ? "Buenos días" : h >= 14 && h < 21 ? "Buenas tardes" : "Buenas noches";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  updateTodayHeader();
  // Si la pestaña se queda abierta, se actualiza al pasar la medianoche / cambiar de franja
  setInterval(updateTodayHeader, 60 * 1000);
});

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("services-grid");
  const template = document.getElementById("service-card-template");
  if (!grid || !template || typeof SERVICIOS === "undefined") return;

  const searchInputs = [
    document.getElementById("dashboard-search"),
    document.querySelector(".topbar .search-bar input")
  ].filter(Boolean);
  const chipsWrap = document.getElementById("dashboard-chips");
  const counter = document.getElementById("services-count");
  const empty = document.getElementById("services-empty");
  const clearBtn = document.getElementById("services-clear");
  const sortSelect = document.getElementById("services-sort");

  const state = { query: "", categoria: "Todos", orden: "destacados" };

  // Favoritos guardados en el navegador (persisten al recargar)
  let favs = new Set();
  try {
    const raw = JSON.parse(localStorage.getItem("lumina-favs") || "[]");
    // Solo aceptamos ids que existan (ignora datos corruptos o manipulados)
    if (Array.isArray(raw)) favs = new Set(raw.filter((id) => SERVICIOS.some((s) => s.id === id)));
  } catch (_) {}
  const saveFavs = () => { try { localStorage.setItem("lumina-favs", JSON.stringify([...favs])); } catch (_) {} };

  // Normaliza texto: minúsculas y sin tildes, para que "fotografia" encuentre "Fotografía"
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  /* ---------- Chips de categoría generados a partir de los datos ---------- */
  const categorias = ["Todos", ...new Set(SERVICIOS.map((s) => s.categoria))];
  categorias.forEach((cat) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "btn btn--outline chip js-chip" + (cat === "Todos" ? " is-active" : "");
    chip.dataset.cat = cat;
    chip.textContent = cat;
    chip.setAttribute("aria-pressed", String(cat === "Todos"));
    chipsWrap.appendChild(chip);
  });
  chipsWrap.addEventListener("click", (e) => {
    const chip = e.target.closest(".js-chip");
    if (!chip) return;
    state.categoria = chip.dataset.cat;
    chipsWrap.querySelectorAll(".js-chip").forEach((c) => {
      const on = c === chip;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", String(on));
    });
    render();
  });

  /* ---------------------- Crear una tarjeta ---------------------- */
  function createCard(s) {
    const node = template.content.cloneNode(true);
    const link = node.querySelector(".card-link");
    link.href = `detalle.html?servicio=${encodeURIComponent(s.categoria.toLowerCase())}&id=${s.id}`;
    node.querySelector(".card__img").style.backgroundImage = `url(${JSON.stringify(s.imagen)})`;
    node.querySelector(".card__badge").textContent = s.categoria;
    node.querySelector(".card__title").textContent = s.titulo;
    node.querySelector(".js-autor").textContent = `Por ${s.fotografo}`;
    node.querySelector(".js-ciudad").textContent = s.ciudad;
    node.querySelector(".js-rating").textContent = `★ ${s.valoracion.toFixed(1)} (${s.resenas})`;
    node.querySelector(".card__price").textContent = `Desde ${s.precio} €`;

    const heart = node.querySelector(".js-fav");
    const paint = () => {
      const on = favs.has(s.id);
      heart.classList.toggle("is-fav", on);
      heart.textContent = on ? "♥" : "♡";
      heart.setAttribute("aria-pressed", String(on));
      heart.setAttribute("aria-label", on ? "Quitar de favoritos" : "Añadir a favoritos");
    };
    paint();
    heart.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (favs.has(s.id)) {
        // Confirmación antes de quitar un favorito
        Modal.confirm({
          title: "¿Quitar de favoritos?",
          message: `"${s.titulo}" dejará de aparecer en tu lista de favoritos.`,
          confirmText: "Quitar",
          danger: true,
          onConfirm: () => { favs.delete(s.id); saveFavs(); paint(); showToast("Eliminado de favoritos"); }
        });
      } else {
        favs.add(s.id); saveFavs(); paint(); showToast("♥ Añadido a favoritos");
      }
    });
    return node;
  }

  /* ---------------------- Filtrar + pintar ---------------------- */
  function render() {
    const q = norm(state.query.trim());
    let lista = SERVICIOS.filter((s) => {
      const okCat = state.categoria === "Todos" || s.categoria === state.categoria;
      const texto = norm(`${s.titulo} ${s.fotografo} ${s.categoria} ${s.ciudad}`);
      return okCat && (!q || q.split(/\s+/).every((w) => texto.includes(w)));
    });

    const orden = {
      destacados: (a, b) => (b.destacado - a.destacado) || (b.valoracion - a.valoracion),
      "precio-asc": (a, b) => a.precio - b.precio,
      "precio-desc": (a, b) => b.precio - a.precio,
      valoracion: (a, b) => b.valoracion - a.valoracion
    };
    lista = [...lista].sort(orden[state.orden]);

    grid.innerHTML = "";
    const frag = document.createDocumentFragment();
    lista.forEach((s) => frag.appendChild(createCard(s)));
    grid.appendChild(frag);

    const n = lista.length;
    counter.textContent = `${n} ${n === 1 ? "servicio disponible" : "servicios disponibles"}`;
    empty.hidden = n !== 0;
  }

  /* ---------------------- Eventos de búsqueda ---------------------- */
  const syncSearch = (value, origin) => {
    state.query = value;
    searchInputs.forEach((i) => { if (i !== origin) i.value = value; });
    render();
  };
  searchInputs.forEach((input) => input.addEventListener("input", () => syncSearch(input.value, input)));

  // Si el topbar está en otra sección, al escribir ahí se baja hasta los resultados
  const topInput = document.querySelector(".topbar .search-bar input");
  if (topInput) topInput.addEventListener("focus", () => {
    document.getElementById("servicios").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  if (sortSelect) sortSelect.addEventListener("change", () => { state.orden = sortSelect.value; render(); });

  if (clearBtn) clearBtn.addEventListener("click", () => {
    chipsWrap.querySelector('[data-cat="Todos"]').click();
    syncSearch("", null);
  });

  // Búsqueda recibida desde otra página (?q=...)
  const qParam = new URLSearchParams(location.search).get("q");
  if (qParam) syncSearch(qParam, null);
  else render();
});
