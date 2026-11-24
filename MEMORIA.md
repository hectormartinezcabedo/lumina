# Memoria técnica del Frontend — Lúmina

**Proyecto 2 · Entrega final: publicación, memoria y repositorio**
Autor: Héctor M.C · Noviembre 2026

| | Enlace |
|---|---|
| Prototipo Figma (Proyecto 1) | [Plataforma de servicios fotográficos](https://www.figma.com/make/qaf9p64Zv2mtou6rcnZzZa/Plataforma-de-servicios-fotogr%C3%A1ficos?t=r8vfZv2nMLauAkSi-1) |
| Web desplegada (GitHub Pages) | https://hectormartinezcabedo.github.io/lumina/ |
| Repositorio | https://github.com/hectormartinezcabedo/lumina |
| Tablero Kanban | https://github.com/users/hectormartinezcabedo/projects/6/views/1 |

---

## 1. Resumen

Lúmina es un marketplace que conecta a clientes con fotógrafos. El frontend está hecho con **HTML5, CSS3 y JavaScript ES6+ nativo**, sin frameworks, sin dependencias y sin paso de compilación. Se puede abrir directamente con `file://` o servirlo como sitio estático (GitHub Pages / Netlify).

El trabajo se hizo en tres capas, una por hito:

1. **Hito 1 · Maquetación:** 14 páginas semánticas y un sistema de diseño con *custom properties*. La interactividad básica se resuelve solo con CSS (`:checked`, `:has()`, `:target`).
2. **Hito 2 · Dinamismo:** validación de formularios, renderizado del Dashboard a partir de datos simulados y componentes interactivos (modal, toasts, menú hamburguesa, buscador).
3. **Entrega final:** validación W3C, consola sin errores, optimización, despliegue y esta documentación.

---

## 2. Estructura del proyecto

```
lumina/
├── index.html            Dashboard: saludo dinámico, hero, categorías y servicios (JS)
├── explorar.html         Catálogo con filtros por categoría (radios + :has())
├── detalle.html          Ficha del servicio + checkout off-canvas con pago
├── reservas.html         Reservas y reseña con estrellas (:target)
├── favoritos.html        Servicios guardados con contador CSS counter()
├── crear.html            Formulario para publicar un servicio
├── perfil.html           Datos personales (formulario validado)
├── ajustes.html          Preferencias con interruptores (toggles)
├── notificaciones.html   Bandeja de avisos categorizados
├── ayuda.html            FAQ con <details>/<summary>
├── login.html            Inicio de sesión (layout split)
├── registro.html         Alta de cuenta (layout split)
├── pago-exitoso.html     Confirmación de pago
├── 404.html              Página de error (GitHub Pages y Netlify la sirven solas)
├── favicon.svg
├── css/
│   ├── variables.css     Tokens de diseño + tema oscuro
│   └── styles.css        Layout, componentes, responsive e interacciones
├── js/
│   ├── mockData.js       Array SERVICIOS (simula la tabla de la BD)
│   ├── ui.js             Tema, menú hamburguesa, Modal, toasts, buscador
│   ├── validation.js     Objeto Validator: reglas, máscaras y formularios
│   └── dashboard.js      Renderizado, filtro, orden y favoritos del Dashboard
└── docs/
    └── MEMORIA.md / .pdf Este documento
```

### 2.1 HTML

Todas las páginas de la aplicación comparten el mismo esqueleto semántico:

```html
<body>
  <input type="checkbox" id="theme-toggle">   <!-- interruptor de tema -->
  <div class="app-layout">
    <aside class="sidebar"> … <nav> … </nav> … </aside>
    <div class="main-wrapper">
      <header class="topbar"> breadcrumbs · buscador · tema · avisos · usuario </header>
      <main class="content-area"> … contenido de la página … </main>
    </div>
  </div>
  <script src="js/…"></script>
</body>
```

Login y registro usan un layout *split* distinto (imagen + formulario), sin sidebar. Se usan etiquetas semánticas (`aside`, `nav`, `header`, `main`, `section`, `article`, `time`, `details`). La jerarquía de encabezados no tiene saltos y los atributos ARIA solo se añaden donde el HTML no basta (`aria-pressed`, `aria-expanded`, `aria-live`, `aria-invalid`).

### 2.2 CSS

- **`variables.css`**: es la única fuente de verdad del diseño. Define la paleta (`--color-primary: #b97d69`, `--color-bg: #fbf9f6`, `--color-text-main: #2b2522`…), las tipografías (Playfair Display para títulos, Inter para texto), los espaciados (`--space-xs` … `--space-xl`), los radios y las sombras. El **tema oscuro** redefine esas mismas variables con `:root:has(#theme-toggle:checked)` y respeta `prefers-color-scheme`.
- **`styles.css`**: está organizado por bloques comentados: reset → layout app → sidebar → topbar → componentes (botones, tarjetas, formularios) → páginas → interacciones CSS → responsive → componentes JS (modal, toasts, validación). Las clases siguen una nomenclatura tipo **BEM** (`.card__title`, `.sidebar__nav`, `.btn--primary`).

Algunas páginas tienen un pequeño bloque `<style>` propio (ajustes, notificaciones, ayuda, detalle, 404) con reglas que solo se usan en ellas.

### 2.3 JavaScript

Hay cuatro scripts clásicos (no módulos), porque los módulos ES y `fetch()` se bloquean al abrir los archivos con `file://`. El orden de carga importa:

```
mockData.js  →  ui.js  →  validation.js  /  dashboard.js
```

| Archivo | Líneas | Dónde se carga | Responsabilidad |
|---|---|---|---|
| `ui.js` | 228 | las 14 páginas | Tema persistente, menú hamburguesa, `Modal`, `showToast()`, confirmación al cerrar sesión, buscador global |
| `validation.js` | 299 | login, registro, crear, perfil, detalle, reservas | `Validator`: reglas, máscaras, validación en tiempo real |
| `mockData.js` | 105 | index, detalle | Constante `SERVICIOS` (8 registros) |
| `dashboard.js` | 175 | index | Pinta tarjetas, chips, filtro, orden y favoritos |

`ui.js` se carga antes que los demás porque estos usan `Modal` y `showToast()`.

---

## 3. Justificación de la maquetación

### 3.1 Flexbox para la estructura en una dimensión

| Componente | Regla | Motivo |
|---|---|---|
| `.app-layout` | `display: flex` | Sidebar de ancho fijo (`260px`, `flex-shrink: 0`) y contenido flexible (`.main-wrapper { flex: 1 }`). |
| `.sidebar` | `flex-direction: column` | Pila vertical; la promo se empuja al fondo con `margin-top: auto`. |
| `.topbar`, `.section-header` | `justify-content: space-between` | Elementos repartidos a los extremos de una fila. |
| `.card` | `flex-direction: column` | Imagen arriba y cuerpo abajo. |
| `.reserva-card` | `column` → `row` a partir de 768 px | La imagen pasa al lado del texto en pantallas anchas. |
| `.filter-chips` | `display: flex; overflow-x: auto` | Chips en una línea con scroll horizontal en móvil. |
| `.fav-page` | `flex-direction: column` + `order` | Reordena el contador y el estado vacío sin tocar el HTML. |

### 3.2 Grid para las rejillas en dos dimensiones

| Componente | Regla | Motivo |
|---|---|---|
| `.grid-cards` | `repeat(auto-fill, minmax(300px, 1fr))` | **Grid intrínseco**: el número de columnas (3 → 2 → 1) se adapta solo al ancho, sin media queries. |
| `.categories-grid` | `repeat(4, 1fr)` → `repeat(2, 1fr)` | Cuatro categorías en escritorio y 2×2 en tablet/móvil. |
| `.detail-layout` | `1fr` → `1.2fr 1fr` | Una columna en móvil; en escritorio la galería es algo más ancha que la ficha. |
| `.form-row-2`, `.checkout-form .form-row` | `1fr 1fr` → `1fr` | Campos emparejados (nombre/apellido, caducidad/CVC). |
| `.user-avatar`, iconos | `display: grid; place-items: center` | Centrado perfecto en una línea. |

### 3.3 Puntos de ruptura (breakpoints)

El diseño parte del escritorio del prototipo de Figma (1440 px) y se adapta hacia abajo, salvo en los componentes que crecen (*mobile-first* con `min-width: 768px`).

| Breakpoint | Tipo | Cambios |
|---|---|---|
| **≤ 1024 px** | `max-width` | Se oculta el nombre del usuario en la topbar (solo queda el avatar). |
| **≤ 900 px** | `max-width` | La sidebar sale del flujo y se convierte en **menú off-canvas** (`position: fixed; transform: translateX(-100%)`) que abre el botón hamburguesa. Se ocultan las breadcrumbs, se reduce el padding y las categorías pasan a 2 columnas. |
| **≥ 768 px** | `min-width` | Detalle a dos columnas (`1.2fr 1fr`) y tarjetas de reserva en horizontal. |
| **≤ 600 px** | `max-width` | Las filas de formulario de dos campos pasan a una columna. |
| **≤ 480 px** | `max-width` | Se oculta el buscador de la topbar (el Dashboard tiene el suyo) y las tarjetas van a una sola columna. |

Se ha comprobado en 1440 × 900 (escritorio), 900 px (tablet) y 390 × 844 (móvil) sin scroll horizontal.

### 3.4 Interacciones solo CSS (Hito 1)

| Interacción | Técnica |
|---|---|
| Menú de usuario | `checkbox` + `:checked ~ .user-dropdown` |
| Filtros de Explorar | radios ocultos + `.content-area:has(#cat-bodas:checked) .card:not(.card--bodas) { display:none }` |
| Corazón favorito | `checkbox` + `::before` (♡ → ♥) |
| Contador de favoritos | `counter-reset` / `counter-increment` + `counter()` |
| Checkout lateral | `checkbox` + overlay + `translateX` |
| Confirmación de reseña | formulario con `action="#ancla"` + `:target` |
| Tema oscuro | `:root:has(#theme-toggle:checked)` |

---

## 4. Lógica JavaScript implementada

### 4.1 Validación de formularios (`validation.js`)

**Reglas declarativas.** Cada campo declara sus reglas en el propio HTML y el `Validator` las interpreta:

```html
<input type="password" id="password" data-rules="required|password">
<input type="password" data-rules="required|match:#password">
<input type="date" data-rules="required|date|adult">
```

```js
const RULES = {
  email: (v) => (!v || EMAIL_RE.test(v.trim()) ? "" : "Introduce un correo válido…"),
  match: (v, selector) => …,
  // cada regla devuelve "" (válido) o el mensaje de error
};
```

Los formularios llevan `novalidate` para desactivar los avisos nativos del navegador, y el error se escribe con `textContent` en un `<small class="field-error">` bajo el campo.

**Ciclo de validación:**

1. **`blur`**: el campo se valida por primera vez al salir de él y queda marcado como *touched*. Así no aparecen errores mientras el usuario todavía no ha escrito.
2. **`input`**: una vez tocado, se revalida en cada pulsación. Se añaden las clases `.is-invalid` / `.is-valid` y el atributo `aria-invalid`.
3. **`submit`**: se validan todos los campos, aparece un resumen («Revisa 2 campos…»), el foco va al primer error y se bloquean los envíos dobles.
4. **Campos dependientes**: al cambiar la contraseña se revalida su confirmación (`match`); al cambiar una fecha de inicio, se revalida la de fin (`after`).

**Catálogo de reglas:** `required`, `email`, `password` (8–64 caracteres, mayúscula, minúscula y número, con medidor de fuerza), `match`, `name` (letras con tildes y ñ), `phone` (9–15 dígitos), `minlength`/`maxlength`, `min`/`max`, `date` (rechaza fechas inexistentes como el 31/02), `future`, `adult` (+18), `after`, `checked`, `radio`, `card` (**algoritmo de Luhn**), `expiry` (MM/AA no caducada) y `cvc`.

**Máscaras de escritura:** `data-mask="card"` agrupa el número de tarjeta de 4 en 4, `expiry` inserta la barra `MM/AA` y `digits` filtra todo lo que no sea un número.

### 4.2 Renderizado dinámico del DOM (`mockData.js` + `dashboard.js`)

`mockData.js` expone `SERVICIOS`, un array de 8 objetos que imita la tabla `servicios` del modelo de datos del Proyecto 1. Es un `.js` y no un `.json` porque `fetch()` no funciona con `file://`.

```
SERVICIOS → filter() → sort() → <template> + cloneNode → DocumentFragment → #services-grid
```

- El HTML de la tarjeta vive en `<template id="service-card-template">` dentro de `index.html`. JavaScript solo lo clona y lo rellena, así que la maquetación sigue estando en el HTML.
- Los datos se insertan con **`textContent`**, nunca con `innerHTML`, para evitar inyección de HTML.
- Todas las tarjetas se añaden de una vez con un **`DocumentFragment`**, de modo que solo hay un *reflow*.
- Los **chips de categoría** se generan a partir de `new Set(SERVICIOS.map(s => s.categoria))` y usan `aria-pressed`.
- El **buscador en vivo** (evento `input`) filtra por título, fotógrafo, categoría y ciudad, sin distinguir tildes ni mayúsculas (`normalize("NFD")`). Se combina con el chip activo.
- La **ordenación** puede ser por destacados, valoración o precio ascendente/descendente.
- El **contador** («8 servicios disponibles») y el **estado vacío** con «Limpiar filtros» se actualizan con cada cambio.
- Los **favoritos** se guardan en `localStorage` (`lumina-favs`). Quitar uno pide confirmación con `Modal.confirm()`.
- Cada tarjeta enlaza a `detalle.html?servicio=…&id=…`. En la ficha, un script lee `URLSearchParams`, busca el servicio en `SERVICIOS` y rellena título, fotógrafo, precio, imagen y el resumen del pago.
- El **saludo y la fecha** de la cabecera («Buenas tardes», «24 De Noviembre De 2026») se recalculan cada minuto con `setInterval`.

### 4.3 Componentes interactivos (`ui.js`)

| Componente | Funcionamiento |
|---|---|
| **Tema persistente** | Guarda la preferencia en `localStorage` y se ejecuta antes de `DOMContentLoaded` para evitar el parpadeo del tema contrario. |
| **Menú hamburguesa** | JS crea el botón en la topbar. Por debajo de 900 px abre la sidebar; se cierra con el fondo, con Esc o al pulsar un enlace. Usa `aria-expanded` e `inert` para que los enlaces ocultos no reciban foco. |
| **`Modal.confirm()` / `Modal.alert()`** | Sustituyen a `confirm()`/`alert()`. Atrapan el foco con Tab, se cierran con Esc y tienen una variante de peligro (cerrar sesión). |
| **`showToast()`** | Avisos breves en una región `aria-live="polite"`. |
| **Buscador global** | En las demás páginas, Enter lleva a `index.html?q=…#servicios`. |

---

## 5. Pruebas y optimización (entrega final)

### 5.1 Validación W3C

Las 14 páginas y las 2 hojas de estilo se han pasado por el **Nu HTML Checker** (el motor de validator.w3.org) y por el validador CSS:

| Antes | Corrección |
|---|---|
| `<div>` dentro de `<label>` en el menú de usuario (11 páginas) | Cambiados a `<span>` (las clases ya fijan el `display`). |
| `<input>` y `<label>` dentro de `<a>` en las tarjetas de Explorar y Favoritos | Patrón de **enlace estirado**: el `<a>` va en el título y su `::after` cubre la tarjeta; el corazón queda por encima con `z-index`. Esto corrigió además un fallo real: el `onclick="event.preventDefault()"` del label impedía marcar el corazón. |
| Saltos de encabezado (`h1 → h3`, `h2 → h4`) | `h4 → h3` en ajustes y notificaciones; `h2` ocultos visualmente (`.visually-hidden`) donde no había un título intermedio visible. |
| `autocomplete="cc-csc"` en `type="password"` | El CVC pasa a `type="text"` con `inputmode="numeric"`. |
| `<time>` vacío sin `datetime` | Valor inicial y atributo `datetime`; JS los actualiza. |

**Resultado: 0 errores y 0 avisos en HTML y CSS.**

### 5.2 Consola del navegador

Se han recorrido las 14 páginas en Chrome a 1440 px y 390 px, y además se han probado los flujos principales (búsqueda «madrid», chips, corazón, enlace de tarjeta, registro con errores, menú hamburguesa y Esc):

- El único error propio era un **404 de `/favicon.ico`**. Se ha añadido `favicon.svg` enlazado en todas las páginas.
- **Resultado: 0 errores y 0 excepciones JavaScript.**

### 5.3 Optimización

- `loading="lazy"` en las imágenes de las categorías.
- `<meta name="description">` propio en cada página.
- `display=swap` en Google Fonts para que el texto no quede invisible mientras carga la fuente.
- Sin librerías ni CDNs de JavaScript: todo el código propio (HTML + CSS + JS, iconos SVG en línea incluidos) ocupa unos 190 KB sin comprimir.
- Renderizado con `DocumentFragment` y búsqueda sin recargar la página.

---

## 6. Despliegue

El sitio es estático y no necesita compilarse.

**GitHub Pages:** *Settings → Pages → Deploy from a branch → `main` / `(root)`*. URL: `https://hectormartinezcabedo.github.io/lumina/`. El archivo `404.html` de la raíz se usa automáticamente como página de error.

El script `publicar.sh` del repositorio automatiza la creación del repo, el *push*, la activación de Pages y el tablero Kanban (requiere `gh auth login`).

---

## 7. Fidelidad Figma ↔ web

| | Enlace |
|---|---|
| Prototipo (Proyecto 1) | [Plataforma de servicios fotográficos](https://www.figma.com/make/qaf9p64Zv2mtou6rcnZzZa/Plataforma-de-servicios-fotogr%C3%A1ficos?t=r8vfZv2nMLauAkSi-1) |
| Desarrollo (Proyecto 2) | https://hectormartinezcabedo.github.io/lumina/ |

| Aspecto | Figma | Web |
|---|---|---|
| Paleta | Terracota `#b97d69`, crema `#fbf9f6`, marrón `#2b2522` | Idénticos, como *custom properties* |
| Tipografía | Playfair Display + Inter | Igual (Google Fonts) |
| Layout | Sidebar 260 px + topbar + contenido | Igual (Flexbox) |
| Tarjetas | 3 columnas, radio 16 px | Grid `auto-fill` (3/2/1 columnas), `--radius-md: 16px` |
| Flujo | Login → Inicio → Explorar → Detalle → Checkout → Pago | Navegable completo |
| Añadidos sobre el prototipo | — | Tema oscuro, menú móvil, validación en vivo, modales y toasts |

---

## 8. Control de versiones y planificación

El historial de commits sigue *Conventional Commits* (`feat`, `style`, `fix`) y refleja las sesiones de trabajo:

| Sesión | Commits |
|---|---|
| 1 · Maquetación HTML | `feat(html)`: estructura semántica de las 14 páginas |
| 2 · Sistema de diseño | `style(tokens)`: variables y tema oscuro · `style(layout)`: Flexbox/Grid y responsive |
| 3 · JS interactivo | `feat(js)`: ui.js · `feat(js)`: validación de formularios |
| 4 · Datos dinámicos | `feat(js)`: renderizado del Dashboard · `feat`: integración de la capa JS |
| 5 · Entrega final | `fix`: W3C y consola · `docs`: memoria, README y despliegue |

**Tablero Kanban** (GitHub Projects): todas las tarjetas están en *Done*: maquetación HTML, tokens CSS, layout y responsive, interacciones CSS, `ui.js`, validación, renderizado dinámico, validación W3C, revisión de consola, despliegue y memoria.
