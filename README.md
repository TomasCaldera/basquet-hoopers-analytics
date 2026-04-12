# Hoppers — Torneo Star Córdoba 2026

Sitio web de estadísticas y análisis para el equipo **Hoppers** en el Torneo Star Córdoba, temporada 2026.

## Estructura del proyecto

```
hoppers-torneo/
├── index.html                  # Sitio web principal (autocontenido)
├── data/
│   └── db.json                 # Base de datos del torneo (planillas procesadas)
├── skills/
│   └── basketball-analyst.md  # Skill de Claude para análisis
└── README.md
```

## Cómo usar con Claude Code

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/hoppers-torneo.git
   cd hoppers-torneo
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
- **Hosting sugerido**: GitHub Pages (activar en Settings → Pages → rama `main`, carpeta `/`)

## Activar GitHub Pages

1. Ir a **Settings** del repositorio
2. Sección **Pages**
3. Source: `Deploy from a branch`
4. Branch: `main` / `/(root)`
5. El sitio queda disponible en `https://tu-usuario.github.io/hoppers-torneo/`

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
