/* ==========================================================================
   validation.js — Validación avanzada de formularios en JavaScript
   - Los formularios llevan "novalidate" para desactivar los tooltips del
     navegador; los errores se pintan en el DOM con mensajes propios.
   - Las reglas se declaran en el HTML con data-rules="regla|regla:param".
   - Validación en tiempo real: al salir del campo (blur) se valida por
     primera vez; a partir de ahí, se revalida en cada pulsación (input).
   ========================================================================== */

const Validator = (() => {
  // Correo: usuario@dominio.tld, sin espacios, sin puntos dobles ni al inicio/fin
  const EMAIL_RE = /^(?!\.)(?!.*\.\.)[^\s@]+(?<!\.)@(?!-)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
  // Cualquier letra (incluye ñ, ç, à, ü...), espacios, apóstrofo y guion
  const NAME_RE = /^[\p{L}][\p{L}' -]*$/u;
  const PHONE_RE = /^\+?[\d\s]{9,15}$/;
  const MAX_AGE = 120;

  // Fecha de hoy a medianoche en hora LOCAL (no UTC)
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseDate = (v) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const d = new Date(v + "T00:00:00");
    // Rechaza fechas "desbordadas" como 2026-02-31
    return isNaN(d) || toISO(d) !== v ? null : d;
  };
  const digits = (v) => v.replace(/\D/g, "");

  // Algoritmo de Luhn: comprueba que un número de tarjeta es coherente
  const luhn = (num) => {
    let sum = 0;
    for (let i = 0; i < num.length; i++) {
      let n = +num[num.length - 1 - i];
      if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }
    return sum % 10 === 0;
  };

  // Cada regla devuelve un mensaje de error o "" si es válida
  const RULES = {
    required: (v, _p, f) => {
      if (f.validity && f.validity.badInput) return "El valor introducido no es válido.";
      return v.trim() ? "" : "Este campo es obligatorio.";
    },
    email: (v) => (!v || EMAIL_RE.test(v.trim()) ? "" : "Introduce un correo válido (ej: nombre@dominio.com)."),
    name: (v) => (!v || NAME_RE.test(v.trim()) ? "" : "Solo se permiten letras, espacios, guiones y apóstrofos."),
    phone: (v) => (!v || PHONE_RE.test(v.trim()) ? "" : "Introduce un teléfono válido (9 a 15 dígitos)."),
    minlength: (v, n) => (!v || v.trim().length >= +n ? "" : `Debe tener al menos ${n} caracteres.`),
    maxlength: (v, n) => (v.trim().length <= +n ? "" : `No puede superar los ${n} caracteres.`),
    min: (v, n) => (!v || +v >= +n ? "" : `El valor mínimo es ${n}.`),
    max: (v, n) => (!v || +v <= +n ? "" : `El valor máximo es ${n}.`),
    password: (v) => {
      if (!v) return "";
      if (v.length < 8) return "Mínimo 8 caracteres.";
      if (v.length > 64) return "Máximo 64 caracteres.";
      if (!/\p{Lu}/u.test(v)) return "Incluye al menos una letra mayúscula.";
      if (!/\p{Ll}/u.test(v)) return "Incluye al menos una letra minúscula.";
      if (!/\d/.test(v)) return "Incluye al menos un número.";
      return "";
    },
    match: (v, selector) => {
      const other = document.querySelector(selector);
      return !v || (other && v === other.value) ? "" : "Las contraseñas no coinciden.";
    },
    date: (v, _p, f) => {
      if (f.validity && f.validity.badInput) return "Fecha incompleta o no válida.";
      return !v || parseDate(v) ? "" : "Introduce una fecha válida.";
    },
    future: (v) => {
      const d = parseDate(v);
      if (!v || !d) return "";
      if (d < today()) return "La fecha no puede ser anterior a hoy.";
      const limit = today(); limit.setFullYear(limit.getFullYear() + 2);
      return d <= limit ? "" : "Solo se puede planificar con 2 años de antelación como máximo.";
    },
    adult: (v) => {
      const d = parseDate(v);
      if (!v || !d) return "";
      if (d > today()) return "La fecha de nacimiento no puede ser futura.";
      const min = today(); min.setFullYear(min.getFullYear() - MAX_AGE);
      if (d < min) return "Revisa el año de nacimiento.";
      const limit = today(); limit.setFullYear(limit.getFullYear() - 18);
      return d <= limit ? "" : "Debes ser mayor de 18 años para registrarte.";
    },
    after: (v, selector) => {
      const other = document.querySelector(selector);
      const a = parseDate(v), b = other && parseDate(other.value);
      if (!a || !b) return "";
      return a >= b ? "" : "Debe ser igual o posterior a la fecha de inicio.";
    },
    checked: (_v, _p, f) => (f.checked ? "" : "Debes aceptar para continuar."),
    radio: (_v, _p, f) => {
      const group = f.form.querySelectorAll(`input[type="radio"][name="${CSS.escape(f.name)}"]`);
      return [...group].some((r) => r.checked) ? "" : "Selecciona una opción.";
    },
    card: (v) => {
      const n = digits(v);
      if (!v) return "";
      if (/[^\d ]/.test(v)) return "Solo se permiten números.";
      if (n.length < 13 || n.length > 19) return "El número debe tener entre 13 y 19 dígitos.";
      return luhn(n) ? "" : "El número de tarjeta no es válido.";
    },
    expiry: (v) => {
      if (!v) return "";
      const m = /^(\d{2})\/(\d{2})$/.exec(v.trim());
      if (!m) return "Usa el formato MM/AA.";
      const mes = +m[1], anio = 2000 + +m[2];
      if (mes < 1 || mes > 12) return "El mes debe estar entre 01 y 12.";
      const now = new Date();
      const finMes = new Date(anio, mes, 0, 23, 59, 59); // último día del mes de caducidad
      if (finMes < now) return "La tarjeta está caducada.";
      return anio <= now.getFullYear() + 20 ? "" : "Revisa el año de caducidad.";
    },
    cvc: (v) => (!v || /^\d{3,4}$/.test(v) ? "" : "El CVC tiene 3 o 4 dígitos.")
  };

  // Máscaras: formatean mientras se escribe (tarjeta, caducidad, solo dígitos)
  const MASKS = {
    card: (v) => digits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 "),
    expiry: (v, prev) => {
      const d = digits(v).slice(0, 4);
      if (d.length <= 2) return v.length < prev.length ? d : d.length === 2 ? d + "/" : d;
      return d.slice(0, 2) + "/" + d.slice(2);
    },
    digits: (v) => digits(v)
  };

  function getErrorEl(field) {
    const group = field.closest(".form-group") || field.parentElement;
    let el = group.querySelector(".field-error");
    if (!el) {
      el = document.createElement("small");
      el.className = "field-error";
      el.id = (field.id || field.name || "f" + Math.random().toString(36).slice(2)) + "-error";
      el.setAttribute("aria-live", "polite");
      group.appendChild(el);
    }
    field.setAttribute("aria-describedby", el.id);
    return el;
  }

  function validateField(field) {
    const rules = (field.dataset.rules || "").split("|").filter(Boolean);
    const value = field.value || "";
    let error = "";
    for (const r of rules) {
      const i = r.indexOf(":");
      const name = i === -1 ? r : r.slice(0, i);
      const param = i === -1 ? undefined : r.slice(i + 1);
      const fn = RULES[name];
      if (fn) error = fn(value, param, field);
      if (error) break;
    }

    const errEl = getErrorEl(field);
    errEl.textContent = error; // textContent: nunca se interpreta como HTML
    const isText = !["checkbox", "radio"].includes(field.type);
    field.classList.toggle("is-invalid", !!error);
    field.classList.toggle("is-valid", isText && !error && value.trim() !== "");
    field.setAttribute("aria-invalid", String(!!error));
    return !error;
  }

  function updateStrength(field) {
    const group = field.closest(".form-group");
    const meter = group && group.querySelector(".password-strength");
    if (!meter) return;
    const v = field.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/\p{Lu}/u.test(v) && /\p{Ll}/u.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^\p{L}\d]/u.test(v) || v.length >= 12) score++;
    const labels = ["Muy débil", "Débil", "Aceptable", "Buena", "Muy segura"];
    meter.dataset.score = v ? score : 0;
    meter.querySelector(".password-strength__label").textContent = v ? labels[score] : "";
  }

  function attach(form, { onSuccess } = {}) {
    form.setAttribute("novalidate", "");
    const fields = [...form.querySelectorAll("[data-rules]")];
    let sending = false;

    const revalidateDependents = (field) => {
      if (!field.id) return;
      const ref = new RegExp("#" + field.id + "(\\||$)"); // coincidencia exacta del id
      fields.filter((f) => f !== field && f.dataset.touched && ref.test(f.dataset.rules)).forEach(validateField);
    };

    fields.forEach((field) => {
      // Radios: se escucha a todo el grupo y el error se asocia al primero
      if (field.type === "radio") {
        form.querySelectorAll(`input[type="radio"][name="${CSS.escape(field.name)}"]`).forEach((r) =>
          r.addEventListener("change", () => { field.dataset.touched = "1"; validateField(field); }));
        return;
      }

      const mask = MASKS[field.dataset.mask];
      let prev = field.value;
      const ev = ["checkbox", "date"].includes(field.type) || field.tagName === "SELECT" ? "change" : "input";

      field.addEventListener("blur", () => { field.dataset.touched = "1"; validateField(field); });
      field.addEventListener(ev, () => {
        if (mask) { field.value = mask(field.value, prev); prev = field.value; }
        if (field.type === "password") updateStrength(field);
        if (field.dataset.touched) validateField(field);
        revalidateDependents(field);
      });
      // Los date también disparan "input" en algunos navegadores al teclear
      if (field.type === "date") field.addEventListener("input", () => { if (field.dataset.touched) validateField(field); revalidateDependents(field); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (sending) return; // evita envíos dobles
      let firstInvalid = null;
      fields.forEach((f) => {
        f.dataset.touched = "1";
        if (!validateField(f) && !firstInvalid) firstInvalid = f;
      });

      const summary = form.querySelector(".form-summary");
      if (firstInvalid) {
        if (summary) {
          const n = fields.filter((f) => f.getAttribute("aria-invalid") === "true").length;
          summary.textContent = `Revisa ${n} ${n === 1 ? "campo marcado" : "campos marcados"} en rojo.`;
          summary.hidden = false;
        }
        firstInvalid.focus();
        return;
      }
      if (summary) summary.hidden = true;
      if (onSuccess) onSuccess(form, () => { sending = true; });
      else { sending = true; form.submit(); }
    });
  }

  return { attach, validateField, RULES, toISO };
})();

/* ------------- Inicialización de los formularios del sitio ------------- */
document.addEventListener("DOMContentLoaded", () => {
  const hasModal = typeof Modal !== "undefined";
  const go = (url) => () => { window.location.href = url; };
  const success = (opts, url) => (hasModal ? Modal.alert({ ...opts, onConfirm: go(url) }) : go(url)());

  const forms = {
    "login-form": (f) => {
      success({ title: "¡Bienvenida de nuevo!", message: "Has iniciado sesión correctamente.", confirmText: "Ir a mi espacio" }, f.action);
    },
    "registro-form": (f) => {
      success({ title: "Cuenta creada", message: "Tu cuenta en Lúmina está lista. ¡Empieza a explorar!", confirmText: "Continuar" }, f.action);
    },
    "crear-form": (f) => {
      Modal.confirm({
        title: "¿Publicar este servicio?",
        message: "Tu propuesta será visible para todos los usuarios de Lúmina.",
        confirmText: "Publicar",
        onConfirm: () => success({ title: "¡Servicio publicado!", message: "Ya puedes verlo en el Dashboard.", confirmText: "Ir al inicio" }, f.action)
      });
    },
    "perfil-form": () => {
      Modal.confirm({
        title: "¿Guardar los cambios?",
        message: "Se actualizarán los datos de tu perfil.",
        confirmText: "Guardar",
        onConfirm: () => showToast("Perfil actualizado correctamente")
      });
    },
    "checkout-form": (f, lock) => {
      const total = f.querySelector('button[type="submit"]').textContent.replace(/^Pagar\s*|\s*y confirmar$/g, "");
      Modal.confirm({
        title: "¿Confirmar el pago?",
        message: `Se cargarán ${total} en tu tarjeta. Esta acción no se puede deshacer.`,
        confirmText: "Pagar ahora",
        onConfirm: () => {
          lock(); // evita un segundo cargo por doble clic
          // Por seguridad, borramos los datos de la tarjeta del DOM antes de salir
          f.querySelectorAll("input").forEach((i) => { i.value = ""; });
          go(f.action)();
        }
      });
    },
    // La reseña se "publica" mostrando el bloque #resena-enviada (CSS :target),
    // sin mandar el texto en la URL.
    "resena-form": () => { window.location.hash = "resena-enviada"; }
  };

  Object.entries(forms).forEach(([id, onSuccess]) => {
    const form = document.getElementById(id);
    if (form) Validator.attach(form, { onSuccess });
  });

  // Límites visuales en los selectores de fecha (usando la fecha LOCAL)
  const iso = Validator.toISO(new Date());
  document.querySelectorAll('input[type="date"][data-rules*="future"]').forEach((i) => (i.min = iso));
  document.querySelectorAll('input[type="date"][data-rules*="adult"]').forEach((i) => (i.max = iso));
});
