---
name: planilla-ingestor
description: >
  Captura e interpreta imágenes de planillas estadísticas de básquet del Torneo Star Córdoba.
  Extrae todos los datos de la imagen, los estructura en JSON, y actualiza la base de datos
  acumulada del torneo. Usar este skill SIEMPRE que el usuario suba una foto, imagen o captura
  de pantalla de una planilla de partido de básquet, o cuando diga frases como "te paso la
  planilla", "acá están los datos del partido", "subí la planilla de la fecha X", "actualizá
  la base de datos", "guardá los datos de hoy". También activar cuando el usuario quiera
  exportar los datos para la web o ver el estado actual de la base de datos del torneo.
---

# Planilla Ingestor — Torneo Star Córdoba

Tu rol es **extraer, estructurar y persistir** los datos de planillas de básquet compartidas
como imágenes. El output es un JSON estandarizado que alimenta al `/basketball-analyst` y
a la futura web del equipo.

---

## Flujo de trabajo

```
1. EXTRAER   → Leer la imagen con máxima precisión
2. ESTRUCTURAR → Construir el JSON del partido
3. VALIDAR   → Verificar consistencia de los números
4. PERSISTIR → Actualizar db.json con los nuevos datos
5. CONFIRMAR → Mostrar resumen al usuario y ofrecer análisis
```

---

## Paso 1 — Extracción de la imagen

Al recibir una imagen de planilla:

1. Leer **todos** los valores de la tabla, celda por celda
2. Identificar el equipo, fecha/número de fecha, rival, resultado final y parciales
3. Registrar **explícitamente** cualquier valor ilegible como `null` con una nota
4. Manejar variaciones comunes de formato:
   - Columnas en orden distinto → mapear por encabezado, no por posición
   - Celdas vacías → asumir `0`, no `null` (salvo que sea ilegible)
   - Nombres con abreviaturas → preservar tal cual aparecen en la imagen
   - Números manuscritos → si hay ambigüedad (1/7, 0/6), mencionar la duda

### Columnas a extraer

| Col | Campo JSON | Tipo |
|-----|-----------|------|
| # | numero | int |
| Nombre | nombre | string |
| MIN | minutos | int/null |
| SC | simples_convertidos | int |
| SF | simples_fallados | int |
| DC | dobles_convertidos | int |
| DF | dobles_fallados | int |
| TC | triples_convertidos | int |
| TF | triples_fallados | int |
| AS | asistencias | int |
| RD | rebotes_defensivos | int |
| RO | rebotes_ofensivos | int |
| FP | faltas_personales | int |
| FT | falta_tecnica | int |
| FA | falta_antideportiva | int |
| TA | tapas | int |
| PE | perdidas | int |
| CA | caminadas | int |
| PTS | puntos | int |
| VAL | valoracion | int/null |

---

## Paso 2 — Estructura JSON del partido

Construir este objeto:

```json
{
  "meta": {
    "fecha_numero": 3,
    "fecha_texto": "2025-04-12",
    "rival": "Nombre Rival",
    "cancha": "local" | "visitante" | null,
    "resultado": "ganado" | "perdido" | "empate",
    "score_propio": 72,
    "score_rival": 65,
    "parciales": {
      "q1": [18, 15],
      "q2": [20, 18],
      "q3": [17, 16],
      "q4": [17, 16],
      "ot": null
    },
    "eficiencia_tiro_equipo": {
      "simples_pct": 0.61,
      "dobles_pct": 0.42,
      "triples_pct": 0.28
    },
    "notas_extraccion": []
  },
  "jugadores": [
    {
      "numero": 4,
      "nombre": "García",
      "minutos": null,
      "simples_convertidos": 3,
      "simples_fallados": 2,
      "dobles_convertidos": 1,
      "dobles_fallados": 3,
      "triples_convertidos": 0,
      "triples_fallados": 1,
      "asistencias": 4,
      "rebotes_defensivos": 2,
      "rebotes_ofensivos": 0,
      "faltas_personales": 2,
      "falta_tecnica": 0,
      "falta_antideportiva": 0,
      "tapas": 0,
      "perdidas": 1,
      "caminadas": 0,
      "puntos": 7,
      "valoracion": 9
    }
  ]
}
```

---

## Paso 3 — Validación (OBLIGATORIA antes de guardar)

**NUNCA guardar sin pasar esta validación primero.** Si algo no cierra, preguntar al usuario antes de proceder.

### Checklist de validación

- **PTS individual**: `PTS = SC*1 + DC*2 + TC*3` para cada jugador
  - Si no coincide → revisar primero si DC/DF están invertidos (error de lectura frecuente)
  - Confirmar con el usuario antes de corregir
- **Total de equipo**: sumar PTS de todos los jugadores y comparar con score_propio
  - Si la suma de jugadores ≠ score oficial → puede ser error del anotador; documentar en notas y usar la suma real
- **VAL coherente**: `VAL = PTS + (RD+RO) + AS + TA - (SF+DF+TF) - PE - CA - FP`
  - Diferencia de ±2 es aceptable
  - Diferencia mayor → marcar como `"val_calculada"` y explicar

### Errores de lectura frecuentes en esta planilla
- **DC vs DF**: las columnas de convertidos y fallados están muy juntas — verificar siempre que DC (convertidos) no sea en realidad DF (fallados) y viceversa
- **Score oficial vs suma jugadores**: el sistema puede registrar un score incorrecto; la suma de PTS individuales es la fuente de verdad
- **Parciales acumulados**: los parciales en la imagen son acumulados (ej: 17, 33, 39, 51), no por cuarto — calcular incrementales

### Mostrar resultado de validación al usuario antes de guardar
```
¿Procedo a guardar?
  F1: suma=28 score=28 ✅ | individuales: sin discrepancias ✅
  F2: suma=32 score=32 ✅ | individuales: sin discrepancias ✅
```

---

## Paso 4 — Persistencia en db.json

### Ubicación
```
/home/claude/torneo-star/db.json
```

Si el archivo no existe, crearlo con la estructura base (ver abajo).

### Operación de upsert
- Si ya existe una entrada con el mismo `fecha_numero`, **reemplazarla** (no duplicar)
- Preguntar al usuario antes de sobreescribir: "Ya tengo datos de la Fecha 3. ¿Los reemplazo?"

### Estructura de db.json

```json
{
  "torneo": {
    "nombre": "Torneo Star",
    "temporada": "2025",
    "equipo": "Nombre del equipo",
    "ultima_actualizacion": "2025-04-12T15:30:00"
  },
  "fechas": [
    { ...objeto partido completo... }
  ],
  "jugadores_registro": {
    "García": {
      "numero": 4,
      "fechas_jugadas": [1, 2, 3],
      "nombre_variantes": ["García", "GARCIA"]
    }
  }
}
```

### Normalización de nombres
- Mantener un registro de variantes del mismo jugador en `jugadores_registro`
- Si aparece un nombre nuevo muy similar a uno existente (Levenshtein ≤ 2 caracteres),
  preguntar: "¿'GARCIIA' es el mismo jugador que 'García'?"

---

## Paso 5 — Confirmación al usuario

Al terminar, mostrar siempre:

```
✅ Fecha [N] guardada — [Equipo] [score] vs [Rival] ([resultado])
   Jugadores registrados: X
   ⚠️ Valores ilegibles: [lista o "ninguno"]
   ⚠️ Inconsistencias: [lista o "ninguna"]

¿Querés que analice este partido ahora? (activa /basketball-analyst)
¿Querés exportar los datos para la web? (genera web-data.json)
```

---

## Integración con Google Drive

### Flujo por fecha nueva

Cuando el usuario sube una imagen de planilla nueva:

1. **Procesar y validar** normalmente (pasos 1-3)
2. **Actualizar db.json** localmente (paso 4)
3. **Buscar db.json en Drive** para verificar si ya existe:
   ```
   Drive search: "db.json" en carpeta "[2026.04] Proyecto #1 :: Web Analítica Hoopers"
   ```
4. **Generar ambos archivos para descarga** y mostrar al usuario:
   ```
   ✅ Listo. Descargá estos archivos y subílos a Drive en:
   📁 [2026.04] Proyecto #1 :: Web Analítica Hoopers > origenes

   📄 fecha_5_DDMMYYYY.jpg  ← imagen original renombrada
   📄 db.json               ← base de datos actualizada (reemplaza la anterior)
   ```
5. **Instrucción al usuario**: reemplazar el `db.json` existente en Drive con el nuevo

### Lectura desde Drive en sesiones futuras

Al inicio de una nueva sesión, si el usuario menciona la base de datos:
1. Buscar `db.json` en Drive con Drive search
2. Leer con Drive fetch
3. Cargar en memoria antes de procesar cualquier planilla nueva

### Ruta canónica en Drive
```
[2026.04] Proyecto #1 :: Web Analítica Hoopers
└── origenes/
    ├── db.json                    ← base de datos acumulada (siempre reemplazar)
    ├── planilla_f1_14032026.jpg
    ├── planilla_f2_21032026.jpg
    └── planilla_fN_DDMMYYYY.jpg
```

### Limitación actual
El conector de Google Drive disponible solo permite **lectura** (Drive search + Drive fetch).
La subida de archivos es manual por parte del usuario. Cuando se integre escritura automática,
este paso se actualizará.

---

## Exportación para la web

Cuando el usuario pida exportar para la web, generar `web-data.json` con esta estructura
simplificada y optimizada para consumo frontend:

Ver detalles en `references/web-export-schema.md`

---

## Manejo de múltiples planillas en una sola sesión

Si el usuario sube varias imágenes seguidas:
1. Procesar cada una independientemente
2. Numerarlas si no tienen fecha identificable: "Planilla 1 de 3"
3. Al final, mostrar un resumen consolidado de todas las fechas procesadas
4. Actualizar db.json una sola vez al final (transacción única)

---

## Integración con /basketball-analyst

Cuando el usuario activa `/basketball-analyst` después de ingestar:
- Pasarle directamente el JSON del partido recién procesado
- Si pide análisis de tendencias, leer todas las `fechas` de db.json y pasarlas juntas
- El analyst no necesita volver a ver las imágenes — trabaja sobre el JSON estructurado

---

## Errores frecuentes y cómo manejarlos

| Situación | Acción |
|-----------|--------|
| Imagen borrosa / ángulo inclinado | Extraer lo que se pueda, null el resto, listar ilegibles |
| Planilla parcial (solo 1er tiempo) | Marcar `"parcial": true` en meta |
| No se ve el marcador final | Calcularlo de los parciales si están completos |
| Jugador sin número | Usar `null` como número |
| Columna no identificable | Ignorar y mencionar en notas |
| db.json corrupto | Hacer backup automático antes de escribir |
