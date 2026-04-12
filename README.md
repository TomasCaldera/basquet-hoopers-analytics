# Basquet Hoopers Analytics — Torneo Star Córdoba 2026

Sitio web de estadísticas y análisis para el equipo **Hoppers** en el Torneo Star Córdoba, temporada 2026.

## Estructura del proyecto

```
basquet-hoopers-analytics/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml   # Deploy automático a GitHub Pages
├── index.html                 # Sitio web principal (autocontenido)
├── data/
│   └── db.json                # Base de datos del torneo (planillas procesadas)
├── skills/
│   └── basketball-analyst.md  # Skill de Claude para análisis
└── README.md
```

## Publicar en dominio público (GitHub Pages)

Este repo ya queda listo para publicarse automáticamente con GitHub Pages usando el workflow de Actions.

1. En GitHub, ir a **Settings → Pages**.
2. En **Source**, seleccionar **GitHub Actions**.
3. Hacer push a `main` (o ejecutar manualmente el workflow **Deploy static site to GitHub Pages**).
4. La URL pública del repo será:
   - **https://tomascaldera.github.io/basquet-hoopers-analytics/**

## Error típico de “Custom domain is not properly formatted”

En **Custom domain** no va el nombre del repositorio (`basquet-hoopers-analytics`).
Debe ir un dominio real, por ejemplo:

- `stats.tudominio.com`
- `hoopersanalytics.com`

Si no tenés dominio propio, dejá ese campo vacío y usá la URL pública de GitHub Pages.

## Si querés usar dominio propio

1. Comprar/usar un dominio (ej. `hoopersanalytics.com`).
2. Configurar DNS en tu proveedor:
   - Para subdominio (`stats.tudominio.com`): registro **CNAME** apuntando a `tomascaldera.github.io`.
   - Para dominio raíz (`tudominio.com`): usar **A/ALIAS/ANAME** según permita el proveedor, apuntando a GitHub Pages.
3. En **Settings → Pages → Custom domain**, escribir ese dominio.
4. Activar **Enforce HTTPS** cuando GitHub valide el certificado.

## Cómo usar con Claude Code

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TomasCaldera/basquet-hoopers-analytics.git
   cd basquet-hoopers-analytics
   ```

2. Abrir en Claude Code:
   ```bash
   claude
   ```

3. Para agregar una nueva fecha, subir la foto de la planilla a Claude y pedirle:
   ```
   Acá está la planilla de la fecha X. Actualizá la base de datos y regenerá el sitio.
   ```

## Stack

- **Frontend**: HTML + CSS + JS puro (sin framework), Chart.js para gráficos
- **Datos**: JSON estático en `data/db.json`
- **Análisis**: Claude con el skill `/basketball-analyst`
- **Hosting**: GitHub Pages + GitHub Actions

## Skill de análisis

El archivo `skills/basketball-analyst.md` contiene las instrucciones para que Claude analice las planillas. Para usarlo desde Claude Code, copiarlo a la carpeta de skills del usuario o referenciarlo directamente en la conversación.

## Flujo de trabajo sugerido

```
Nuevo partido
     ↓
Foto de la planilla → Claude Code → Actualiza db.json
     ↓
Claude regenera index.html con los nuevos datos
     ↓
git add . && git commit -m "Fecha X vs Rival" && git push
     ↓
GitHub Pages actualiza el sitio automáticamente
```

## Base de datos

`data/db.json` contiene:
- Metadata del torneo (nombre, temporada, equipo)
- Array `fechas[]` con cada partido: resultado, parciales por cuarto, jugadores con estadísticas
- `jugadores_registro` con el historial de apariciones por jugador

Para agregar una fecha nueva, Claude Code lee la imagen de la planilla, extrae los datos y agrega el objeto correspondiente al array `fechas`.
