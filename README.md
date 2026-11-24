# lúmina.

Marketplace de fotografía que conecta a clientes con fotógrafos. Está hecho con **HTML5, CSS3 y JavaScript ES6+ nativo**, sin frameworks, sin dependencias y sin paso de compilación.

- 🌐 **Web:** https://TU-USUARIO.github.io/lumina/
- 🎨 **Prototipo Figma:** [ENLACE FIGMA]
- 📄 **Memoria técnica:** [docs/MEMORIA.md](docs/MEMORIA.md) · [PDF](docs/MEMORIA.pdf)

## Cómo verlo en local

Abre `index.html` en el navegador (funciona con `file://`) o usa **Live Server** en VS Code.

## Demo rápida

1. `index.html` en móvil → menú hamburguesa.
2. Escribe «madrid» en el buscador → filtro en vivo · pulsa un chip de categoría.
3. `registro.html` → envía el formulario vacío para ver la validación.
4. `detalle.html` → completa el pago para ver el modal de confirmación.
5. Botón de luna → tema oscuro (se recuerda entre páginas).

## Estructura

```
*.html        14 páginas (app + login/registro + 404)
css/          variables.css (tokens + tema oscuro) · styles.css
js/           mockData.js · ui.js · validation.js · dashboard.js
docs/         Memoria técnica
```

## Calidad

- ✅ HTML y CSS validados con el W3C Nu HTML Checker: 0 errores.
- ✅ Consola del navegador sin errores en las 14 páginas (escritorio y móvil).

## Publicar

```bash
gh auth login          # una vez
./publicar.sh          # crea el repo, hace push, activa Pages y crea el Kanban
```
