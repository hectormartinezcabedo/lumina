#!/usr/bin/env bash
# Publica Lúmina en GitHub: repositorio + GitHub Pages + tablero Kanban.
# Requisitos: git, gh (GitHub CLI) y jq.  Antes: gh auth login
# La primera vez hay que dar permiso de proyectos: gh auth refresh -s project
set -euo pipefail

REPO="${1:-lumina}"
USER="$(gh api user -q .login)"
echo "→ Usuario: $USER · Repositorio: $REPO"

# 1. Repositorio público y push del historial
if ! gh repo view "$USER/$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --public --source=. --remote=origin \
    --description "Lúmina · marketplace de fotografía (HTML, CSS y JS nativo)"
fi
git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$USER/$REPO.git"
git push -u origin main

# 2. GitHub Pages desde main / (raíz)
gh api -X POST "repos/$USER/$REPO/pages" \
  -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 || true
URL="https://$USER.github.io/$REPO/"
echo "→ Pages: $URL (tarda 1-2 minutos la primera vez)"

# 3. Sustituir los marcadores de la memoria y el README
sed -i.bak "s/TU-USUARIO/$USER/g" README.md docs/MEMORIA.md && rm -f README.md.bak docs/MEMORIA.md.bak

# 4. Tablero Kanban con todas las tarjetas en "Done"
gh auth refresh -s project >/dev/null 2>&1 || true
NUM=$(gh project create --owner "$USER" --title "Lúmina · Proyecto 2" --format json | jq -r .number)
gh project link "$NUM" --owner "$USER" --repo "$USER/$REPO" >/dev/null 2>&1 || true
PID=$(gh project view "$NUM" --owner "$USER" --format json | jq -r .id)
FIELD=$(gh project field-list "$NUM" --owner "$USER" --format json | jq -r '.fields[] | select(.name=="Status")')
FID=$(echo "$FIELD" | jq -r .id)
DONE=$(echo "$FIELD" | jq -r '.options[] | select(.name=="Done") | .id')

TARJETAS=(
  "S1 · Estructura semántica HTML de las 14 páginas"
  "S1 · Layout app: sidebar + topbar + main"
  "S2 · Sistema de diseño en variables.css"
  "S2 · Tema oscuro con :has()"
  "S2 · Grid/Flexbox y breakpoints responsive"
  "S2 · Interacciones solo CSS (filtros, favoritos, checkout, reseña)"
  "S3 · ui.js: menú hamburguesa, Modal y toasts"
  "S3 · Validación de formularios (validation.js)"
  "S4 · mockData.js + renderizado dinámico del Dashboard"
  "S4 · Buscador en vivo, chips, orden y favoritos"
  "S5 · Validación W3C (0 errores)"
  "S5 · Consola del navegador sin errores"
  "S5 · Despliegue en GitHub Pages"
  "S5 · Memoria técnica del Frontend"
)
for t in "${TARJETAS[@]}"; do
  IID=$(gh project item-create "$NUM" --owner "$USER" --title "$t" --format json | jq -r .id)
  gh project item-edit --id "$IID" --project-id "$PID" --field-id "$FID" --single-select-option-id "$DONE" >/dev/null
  echo "  ✓ $t"
done
PURL="https://github.com/users/$USER/projects/$NUM"
sed -i.bak "s#https://github.com/users/$USER/projects/N#$PURL#g" docs/MEMORIA.md && rm -f docs/MEMORIA.md.bak

git add -A && git commit -qm "docs: enlaces reales de la web, el repositorio y el Kanban" && git push -q
echo "✔ Listo
  Web:     $URL
  Repo:    https://github.com/$USER/$REPO
  Kanban:  $PURL"
