# Hoppers Analytics — Torneo Star Córdoba 2026

> Un dashboard de estadísticas para un equipo de básquet amateur, construido con fotos de planillas, Claude y cero infraestructura.

**[→ Ver el sitio en vivo](https://tomascaldera.github.io/basquet-hoopers-analytics/)**

---

## El proyecto

Los **Hoppers** juegan en el Torneo Star de Córdoba. Como en la mayoría de los torneos amateurs, al final de cada partido te dan una planilla de papel con todas las estadísticas. Ese papel suele terminar en una mochila y nunca más se ve.

Este proyecto transforma esas planillas en un dashboard con evolución del equipo, análisis por jugador y tendencias a lo largo de la temporada — sin ningún backend, sin base de datos, sin servidor.

El flujo es simple:

```
Foto de la planilla
       ↓
Claude lee la imagen y extrae los datos
       ↓
Revisión manual en una tabla editable (review.html)
       ↓
Los datos se guardan en data/db.json
       ↓
Claude analiza el partido y la evolución del equipo
       ↓
index.html se actualiza con los nuevos datos y análisis
       ↓
git push → GitHub Pages despliega el sitio en segundos
```

No hay nada más. El sitio es un HTML estático con Chart.js. Los datos son un JSON. El análisis lo hace Claude leyendo el JSON y las planillas anteriores.

---

## El equipo

Hoppers terminó las primeras 8 fechas con récord **0–8**, pero eso no cuenta la historia real:

| Fecha | Hoppers | Rival | Diferencial |
|-------|---------|-------|-------------|
| F1 vs Independencia | 28 | 68 | −40 |
| F2 vs Jurasicos | 32 | 70 | −38 |
| F3 vs Los Changos | 31 | 34 | **−3** |
| F4 vs Doble Cuarto | 38 | 51 | −13 |
| F5 vs Walkers | 51 | 69 | −18 |
| F6 vs Incas | 44 | 55 | −11 |
| F7 vs Dead Cow | 32 | 49 | −17 |
| F8 vs South Ballers | 46 | 56 | **−10** |

De −40 a −10. El equipo que empezó perdiendo de a 40 ganó Q1 en los últimos 3 partidos, ganó Q4 en F8, y en F8 Gonzalez anotó 22 pts — el máximo individual del torneo. El tablero existe para hacer visible ese progreso.

---

## Estructura

```
basquet-hoopers-analytics/
├── index.html                    # Dashboard completo (autocontenido, sin build)
├── data/
│   └── db.json                   # Base de datos del torneo
├── planillas/
│   ├── planilla_fN_DDMMYYYY.jpeg # Fotos de las planillas (fuente de verdad)
│   ├── f5_data.json              # Datos corregidos por el usuario
│   ├── f6_data.json
│   └── review/
│       └── review.html           # Herramienta de revisión y corrección
├── analisis/
│   ├── f5_analisis.md            # Análisis por partido generado por Claude
│   ├── f6_analisis.md
│   ├── f7_analisis.md
│   ├── f8_analisis.md
│   └── tendencias_8f.md          # Tendencias acumuladas de la temporada
├── skills/
│   ├── planilla-ingestor.md      # Skill de Claude para leer planillas
│   └── basketball-analyst.md    # Skill de Claude para analizar partidos
├── assets/
│   └── team-photo.jpg            # Foto del equipo para el header
└── .github/
    └── workflows/
        └── deploy-pages.yml      # Deploy automático a GitHub Pages
```

---

## Cómo agregar una fecha nueva

1. Subir la foto de la planilla a `planillas/` con el nombre `planilla_fN_DDMMYYYY.jpeg`
2. Abrir Claude Code en este directorio
3. Decirle a Claude: *"Tengo la planilla de la fecha N, procesala"*
4. Claude va a:
   - Leer la imagen y extraer los datos
   - Generar `planillas/review/review.html` con los valores precargados para revisar
   - Después de la revisión, persistir los datos en `data/db.json`
   - Correr el análisis del partido y de tendencias acumuladas
   - Guardar el análisis en `analisis/`
   - Actualizar `index.html` con la nueva fecha
5. `git push` → el sitio se actualiza solo

### El paso de revisión

Las fotos de planillas de torneos amateurs suelen ser tomadas con el celular en condiciones de luz variable. Para no depender de que Claude lea perfectamente cada número, el proceso tiene una etapa intermedia: una tabla HTML editable con los valores que Claude extrajo, resaltando en amarillo los que son inciertos. El usuario corrige lo necesario, descarga el JSON validado, y recién ahí los datos se guardan.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML + CSS + JS puro, sin framework |
| Gráficos | Chart.js 4.4.1 |
| Datos | JSON estático (`data/db.json`) |
| Extracción | Claude (lectura de imágenes) |
| Análisis | Claude con skill `basketball-analyst.md` |
| Hosting | GitHub Pages |
| Deploy | GitHub Actions (push a `main` → deploy automático) |

El sitio no tiene backend, no tiene base de datos en la nube, no tiene costos de hosting. Todo corre en el navegador a partir de un JSON local.

---

## Por qué Claude Code

La extracción de datos de planillas manuscritas y la escritura de análisis de básquet son exactamente el tipo de tarea donde un LLM agrega valor real. Claude lee la imagen, identifica a los jugadores por número de camiseta, calcula PTS = SC×1 + DC×2 + TC×3, detecta inconsistencias, y escribe análisis con contexto acumulado de todas las fechas anteriores.

Lo que haría falta programar manualmente (OCR + parser + validador + motor de análisis) se reemplaza por una conversación.

---

## URL del sitio

**https://tomascaldera.github.io/basquet-hoopers-analytics/**

Para configurar dominio propio: Settings → Pages → Custom domain. Para un subdominio, agregar un registro CNAME apuntando a `tomascaldera.github.io`.
