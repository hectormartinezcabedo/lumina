/* ==========================================================================
   ui.js — Componentes interactivos comunes a todas las páginas
   - Menú hamburguesa (sidebar desplegable en móvil)
   - Modales de confirmación / aviso (sin alert/confirm del navegador)
   - Toasts (avisos breves)
   - Confirmación al cerrar sesión
   - Buscador de la barra superior (redirige al Dashboard con ?q=)
   ========================================================================== */

/* ------------------------ TEMA PERSISTENTE ------------------------
   El checkbox #theme-toggle INVIERTE el tema del sistema (ver variables.css).
   Guardamos el tema elegido ("light"/"dark") y en cada página calculamos
   si hay que marcar el checkbox para conseguirlo. Se ejecuta al momento
   (no en DOMContentLoaded) para evitar un parpadeo del tema contrario. */
(function initTheme() {
  let toggle = document.getElementById("theme-toggle");
  if (!toggle) {
    // Páginas sin botón de tema (login, registro...): creamos el interruptor
    // oculto igualmente para que respeten el tema guardado.
    toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = "theme-toggle";
    toggle.hidden = true;
    toggle.tabIndex = -1;
    toggle.setAttribute("aria-hidden", "true");
    document.body.prepend(toggle);
  }
  const KEY = "lumina-theme";
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const systemTheme = () => (media.matches ? "dark" : "light");
  const read = () => {
    let v = null;
    try { v = localStorage.getItem(KEY); } catch (_) {}
    return v === "light" || v === "dark" ? v : null; // ignora valores manipulados
  };

  toggle.autocomplete = "off"; // que el navegador no restaure el estado por su cuenta

  const apply = () => {
    const saved = read();
    toggle.checked = !!saved && saved !== systemTheme();
  };
  apply();

  toggle.addEventListener("change", () => {
    const current = toggle.checked ? (systemTheme() === "dark" ? "light" : "dark") : systemTheme();
    try { localStorage.setItem(KEY, current); } catch (_) {}
  });

  // Al volver atrás (caché del navegador) o si cambia el tema del sistema
  window.addEventListener("pageshow", apply);
  media.addEventListener("change", apply);
})();

/* ---------------------------- MODAL ---------------------------- */
const Modal = (() => {
  let overlay, box, titleEl, msgEl, btnOk, btnCancel, onOk = null, lastFocus = null, hideTimer = null;

  function build() {
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button type="button" class="modal__close" aria-label="Cerrar">×</button>
        <div class="modal__icon" aria-hidden="true"></div>
        <h3 class="modal__title" id="modal-title"></h3>
        <p class="modal__message"></p>
        <div class="modal__actions">
          <button type="button" class="btn btn--outline modal__cancel">Cancelar</button>
          <button type="button" class="btn btn--primary modal__ok">Aceptar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    box = overlay.querySelector(".modal");
    titleEl = overlay.querySelector(".modal__title");
    msgEl = overlay.querySelector(".modal__message");
    btnOk = overlay.querySelector(".modal__ok");
    btnCancel = overlay.querySelector(".modal__cancel");

    btnOk.addEventListener("click", () => {
      const cb = onOk;
      close();
      if (cb) cb();
    });
    btnCancel.addEventListener("click", close);
    overlay.querySelector(".modal__close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (overlay.hidden) return;
      if (e.key === "Escape") close();
      // Trampa de foco: Tab no puede salir del modal mientras está abierto
      if (e.key === "Tab") {
        const items = [...box.querySelectorAll("button")].filter((b) => !b.hidden);
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function open({ title, message, icon = "!", confirmText = "Aceptar", cancelText = "Cancelar", showCancel = true, danger = false, onConfirm = null }) {
    if (!overlay) build();
    clearTimeout(hideTimer); // por si se abre un modal justo al cerrar otro
    titleEl.textContent = title;
    msgEl.textContent = message;
    overlay.querySelector(".modal__icon").textContent = icon;
    btnOk.textContent = confirmText;
    btnCancel.textContent = cancelText;
    btnCancel.hidden = !showCancel;
    box.classList.toggle("modal--danger", danger);
    onOk = onConfirm;
    lastFocus = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-visible"));
    btnOk.focus();
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove("is-visible");
    onOk = null;
    hideTimer = setTimeout(() => { overlay.hidden = true; }, 200);
    if (lastFocus) lastFocus.focus();
  }

  return {
    confirm: (opts) => open({ icon: "?", ...opts }),
    alert: (opts) => open({ icon: "✓", showCancel: false, ...opts }),
    close
  };
})();

/* ---------------------------- TOAST ---------------------------- */
function showToast(message) {
  let stack = document.querySelector(".js-toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "js-toast-stack";
    stack.setAttribute("aria-live", "polite");
    document.body.appendChild(stack);
  }
  const toast = document.createElement("div");
  toast.className = "js-toast";
  toast.textContent = message;
  stack.appendChild(toast);
  setTimeout(() => toast.classList.add("is-leaving"), 2200);
  setTimeout(() => toast.remove(), 2600);
}

/* ------------------------ MENÚ HAMBURGUESA ------------------------ */
function initHamburger() {
  const sidebar = document.querySelector(".sidebar");
  const topbar = document.querySelector(".topbar");
  if (!sidebar || !topbar) return;

  sidebar.id = sidebar.id || "sidebar";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "hamburger";
  btn.setAttribute("aria-label", "Abrir menú");
  btn.setAttribute("aria-controls", sidebar.id);
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = "<span></span><span></span><span></span>";
  topbar.prepend(btn);

  const backdrop = document.createElement("div");
  backdrop.className = "sidebar-backdrop";
  document.body.appendChild(backdrop);

  const isMobile = () => window.matchMedia("(max-width: 900px)").matches;
  const setOpen = (open) => {
    // En móvil, con el menú cerrado, sus enlaces no deben recibir foco con Tab
    sidebar.inert = isMobile() && !open;
    sidebar.classList.toggle("sidebar--open", open);
    backdrop.classList.toggle("is-visible", open);
    btn.classList.toggle("is-active", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };

  btn.addEventListener("click", () => setOpen(!sidebar.classList.contains("sidebar--open")));
  backdrop.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("sidebar--open")) { setOpen(false); btn.focus(); }
  });
  sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("resize", () => setOpen(sidebar.classList.contains("sidebar--open") && isMobile()));
  setOpen(false);
}

/* --------------------- CONFIRMAR CERRAR SESIÓN --------------------- */
function initLogoutConfirm() {
  document.querySelectorAll('.app-layout a[href="login.html"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      Modal.confirm({
        title: "¿Cerrar sesión?",
        message: "Tendrás que volver a introducir tus datos para acceder a tu espacio.",
        confirmText: "Sí, cerrar sesión",
        danger: true,
        onConfirm: () => { window.location.href = link.href; }
      });
    });
  });
}

/* ----------------- BUSCADOR DE LA BARRA SUPERIOR ----------------- */
function initTopbarSearch() {
  const input = document.querySelector(".topbar .search-bar input");
  if (!input) return;
  // En el Dashboard el buscador filtra en tiempo real (lo gestiona dashboard.js)
  if (document.getElementById("services-grid")) return;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      window.location.href = "index.html?q=" + encodeURIComponent(input.value.trim()) + "#servicios";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initHamburger();
  initLogoutConfirm();
  initTopbarSearch();
});
