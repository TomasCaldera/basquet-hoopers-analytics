const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));

// ── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  navy:    '0D1F38',
  blue:    '1A5FB4',
  blueLt:  'DBEAFE',
  gold:    'D97706',
  goldLt:  'FEF3C7',
  green:   '0C7A52',
  greenLt: 'DCFCE7',
  red:     'BE3A2A',
  redLt:   'FEE2E2',
  gray:    'F1F5F9',
  gray2:   'E2E8F0',
  white:   'FFFFFF',
  text:    '1E293B',
  textLt:  '64748B',
};

const COLS = [
  { key: 'numero',               header: '#',    width: 5  },
  { key: 'nombre',               header: 'NOMBRE', width: 14 },
  { key: 'minutos',              header: 'MIN',  width: 5  },
  { key: 'simples_convertidos',  header: 'SC',   width: 5  },
  { key: 'simples_fallados',     header: 'SF',   width: 5  },
  { key: 'dobles_convertidos',   header: 'DC',   width: 5  },
  { key: 'dobles_fallados',      header: 'DF',   width: 5  },
  { key: 'triples_convertidos',  header: 'TC',   width: 5  },
  { key: 'triples_fallados',     header: 'TF',   width: 5  },
  { key: 'asistencias',          header: 'AS',   width: 5  },
  { key: 'rebotes_defensivos',   header: 'RD',   width: 5  },
  { key: 'rebotes_ofensivos',    header: 'RO',   width: 5  },
  { key: 'faltas_personales',    header: 'FP',   width: 5  },
  { key: 'falta_tecnica',        header: 'FT',   width: 5  },
  { key: 'falta_antideportiva',  header: 'FA',   width: 5  },
  { key: 'tapas',                header: 'TA',   width: 5  },
  { key: 'perdidas',             header: 'PE',   width: 5  },
  { key: 'caminadas',            header: 'CA',   width: 5  },
  { key: 'puntos',               header: 'PTS',  width: 6  },
  { key: 'valoracion',           header: 'VAL',  width: 6  },
];
const NCOLS = COLS.length; // 20

// ── Helpers ──────────────────────────────────────────────────────────────────
function cellFill(color) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } };
}
function border(style = 'thin') {
  const s = { style, color: { argb: 'FF' + C.gray2 } };
  return { top: s, left: s, bottom: s, right: s };
}
function boldBorder(style = 'medium') {
  const s = { style, color: { argb: 'FF' + C.navy } };
  return { top: s, left: s, bottom: s, right: s };
}
function font(bold, color, size = 11) {
  return { bold, color: { argb: 'FF' + color }, size, name: 'Calibri' };
}
function align(horizontal, vertical = 'middle') {
  return { horizontal, vertical, wrapText: false };
}

function applyRow(row, fill, fnt, brd, aln) {
  row.eachCell({ includeEmpty: true }, cell => {
    if (fill) cell.fill = fill;
    if (fnt)  cell.font = fnt;
    if (brd)  cell.border = brd;
    if (aln)  cell.alignment = aln;
  });
}

function setCell(ws, r, c, value, fill, fnt, brd, aln) {
  const cell = ws.getCell(r, c);
  cell.value = value;
  if (fill) cell.fill = fill;
  if (fnt)  cell.font = fnt;
  if (brd)  cell.border = brd;
  if (aln)  cell.alignment = aln || align('center');
}

// ── Column letter helper ──────────────────────────────────────────────────────
function colLetter(n) {
  let s = '';
  while (n > 0) { s = String.fromCharCode(65 + (n - 1) % 26) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ── Build one Fecha sheet ─────────────────────────────────────────────────────
function buildFechaSheet(wb, fecha) {
  const m = fecha.meta;
  const sheetName = `F${m.fecha_numero}`;
  const ws = wb.addWorksheet(sheetName, { properties: { tabColor: { argb: 'FF' + C.blue } } });

  // Column widths
  COLS.forEach((col, i) => { ws.getColumn(i + 1).width = col.width; });

  let row = 1;

  // ── HEADER BLOQUE ──────────────────────────────────────────────────────────
  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1,
    `HOPPERS — Torneo Star Córdoba 2026`,
    cellFill(C.navy), font(true, C.white, 14), null, align('center'));
  ws.getRow(row).height = 22; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1,
    `Fecha ${m.fecha_numero}  ·  ${m.fecha_texto}`,
    cellFill(C.navy), font(false, 'DBEAFE', 11), null, align('center'));
  ws.getRow(row).height = 18; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1,
    `vs  ${m.rival.toUpperCase()}`,
    cellFill(C.navy), font(true, C.gold, 13), null, align('center'));
  ws.getRow(row).height = 20; row++;

  // Score + resultado
  const resultLabel = m.resultado === 'ganado' ? '✔ VICTORIA' : m.resultado === 'perdido' ? '✘ DERROTA' : '= EMPATE';
  const resultColor = m.resultado === 'ganado' ? C.green : m.resultado === 'perdido' ? C.red : C.gold;
  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1,
    `${resultLabel}    Hoppers ${m.score_propio}  —  ${m.score_rival}  ${m.rival}`,
    cellFill(resultColor + '22'), font(true, resultColor, 12), null, align('center'));
  ws.getRow(row).height = 18; row++;

  // Parciales
  const p = m.parciales;
  const parcStr = [
    `Q1: ${p.q1[0]} – ${p.q1[1]}`,
    `Q2: ${p.q2[0]} – ${p.q2[1]}`,
    `Q3: ${p.q3[0]} – ${p.q3[1]}`,
    `Q4: ${p.q4[0]} – ${p.q4[1]}`,
    p.ot ? `OT: ${p.ot[0]} – ${p.ot[1]}` : null,
  ].filter(Boolean).join('     ');
  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1,
    `Parciales (Hoppers – Rival):   ${parcStr}`,
    cellFill(C.gray), font(false, C.textLt, 10), null, align('center'));
  ws.getRow(row).height = 16; row++;

  // Blank separator
  ws.mergeCells(row, 1, row, NCOLS);
  ws.getRow(row).height = 8; row++;

  // ── HOPPERS SECTION ────────────────────────────────────────────────────────
  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1,
    '🏀  HOPPERS',
    cellFill(C.blue), font(true, C.white, 12), null, align('left'));
  ws.getRow(row).height = 20; row++;

  // Column headers
  COLS.forEach((col, i) => {
    setCell(ws, row, i + 1, col.header,
      cellFill(C.navy), font(true, C.gold, 10),
      border('thin'), align('center'));
  });
  ws.getRow(row).height = 16; row++;

  const dataStartRow = row;

  // Player rows
  fecha.jugadores.forEach((j, idx) => {
    const rowBg = idx % 2 === 0 ? C.white : C.gray;
    COLS.forEach((col, ci) => {
      let val = j[col.key];
      if (val === null || val === undefined) val = '';
      setCell(ws, row, ci + 1, val,
        cellFill(rowBg), font(false, C.text, 10),
        border('thin'), align(ci === 1 ? 'left' : 'center'));
    });
    // PTS formula: SC + DC*2 + TC*3 (cols: SC=4, DC=6, TC=8 → 1-based)
    const scCol = colLetter(4), dcCol = colLetter(6), tcCol = colLetter(8);
    const ptsCol = colLetter(19);
    ws.getCell(`${ptsCol}${row}`).value = {
      formula: `${scCol}${row}*1+${dcCol}${row}*2+${tcCol}${row}*3`
    };
    ws.getRow(row).height = 15; row++;
  });

  const dataEndRow = row - 1;

  // Totals row
  ws.getRow(row).height = 16;
  COLS.forEach((col, ci) => {
    const isNombre = ci === 1, isNumero = ci === 0, isMin = ci === 2, isVal = ci === 19;
    let val;
    if (isNombre) { val = 'TOTALES'; }
    else if (isNumero || isMin || isVal) { val = ''; }
    else {
      const colL = colLetter(ci + 1);
      val = { formula: `SUM(${colL}${dataStartRow}:${colL}${dataEndRow})` };
    }
    setCell(ws, row, ci + 1, val,
      cellFill(C.navy), font(true, C.gold, 10),
      boldBorder('medium'), align(ci === 1 ? 'left' : 'center'));
  });
  row++;

  // Shooting efficiency row
  const ef = m.eficiencia_tiro_equipo;
  ws.mergeCells(row, 1, row, 3);
  setCell(ws, row, 1, 'Eficiencia Hoppers', cellFill(C.blueLt), font(true, C.blue, 9), border('thin'), align('left'));
  setCell(ws, row, 4, `SC: ${Math.round(ef.simples_pct * 100)}%`, cellFill(C.blueLt), font(false, C.text, 9), border('thin'), align('center'));
  ws.mergeCells(row, 4, row, 5);
  setCell(ws, row, 6, `DC: ${Math.round(ef.dobles_pct * 100)}%`, cellFill(C.blueLt), font(false, C.text, 9), border('thin'), align('center'));
  ws.mergeCells(row, 6, row, 7);
  setCell(ws, row, 8, `TC: ${Math.round(ef.triples_pct * 100)}%`, cellFill(C.blueLt), font(false, C.text, 9), border('thin'), align('center'));
  ws.mergeCells(row, 8, row, 9);
  ws.mergeCells(row, 10, row, NCOLS);
  ws.getRow(row).height = 14; row++;

  // Blank separator
  ws.mergeCells(row, 1, row, NCOLS);
  ws.getRow(row).height = 10; row++;

  // ── RIVAL SECTION ──────────────────────────────────────────────────────────
  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1,
    `🏀  ${m.rival.toUpperCase()}`,
    cellFill(C.text), font(true, C.white, 12), null, align('left'));
  ws.getRow(row).height = 20; row++;

  // Rival sub-headers: Q1, Q2, Q3, Q4, OT, TOTAL, SC%, DC%, TC%
  const rivalHeaders = ['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'TOTAL', 'SC%', 'DC%', 'TC%'];
  rivalHeaders.forEach((h, i) => {
    setCell(ws, row, i + 1, h,
      cellFill(C.gray2), font(true, C.navy, 10),
      border('thin'), align('center'));
  });
  ws.mergeCells(row, rivalHeaders.length + 1, row, NCOLS);
  ws.getRow(row).height = 16; row++;

  // Rival data row
  const re = m.eficiencia_rival || {};
  const rivalData = [
    p.q1[1], p.q2[1], p.q3[1], p.q4[1],
    p.ot ? p.ot[1] : '',
    m.score_rival,
    re.simples_pct != null ? Math.round(re.simples_pct * 100) + '%' : '—',
    re.dobles_pct  != null ? Math.round(re.dobles_pct  * 100) + '%' : '—',
    re.triples_pct != null ? Math.round(re.triples_pct * 100) + '%' : '—',
  ];
  rivalData.forEach((val, i) => {
    const isTotalCol = i === 5;
    setCell(ws, row, i + 1, val,
      cellFill(isTotalCol ? C.gray2 : C.white),
      font(isTotalCol, C.text, 10),
      border('thin'), align('center'));
  });
  ws.mergeCells(row, rivalHeaders.length + 1, row, NCOLS);
  ws.getRow(row).height = 15; row++;

  // Note about rival individual stats
  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1,
    'Nota: estadísticas individuales del rival no registradas en planilla.',
    cellFill(C.gray), font(false, C.textLt, 9), null, align('left'));
  ws.getRow(row).height = 13; row++;

  // Freeze top rows
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 8, activeCell: 'A9' }];

  // Print area
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1 };

  return ws;
}

// ── Build TEMPLATE sheet ──────────────────────────────────────────────────────
function buildTemplateSheet(wb) {
  const ws = wb.addWorksheet('TEMPLATE', {
    properties: { tabColor: { argb: 'FF' + C.gold } }
  });

  COLS.forEach((col, i) => { ws.getColumn(i + 1).width = col.width; });

  let row = 1;

  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1, 'HOPPERS — Torneo Star Córdoba 2026',
    cellFill(C.navy), font(true, C.white, 14), null, align('center'));
  ws.getRow(row).height = 22; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1, 'Fecha N  ·  YYYY-MM-DD',
    cellFill(C.navy), font(false, 'DBEAFE', 11), null, align('center'));
  ws.getRow(row).height = 18; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1, 'vs  RIVAL',
    cellFill(C.navy), font(true, C.gold, 13), null, align('center'));
  ws.getRow(row).height = 20; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1, 'VICTORIA / DERROTA    Hoppers X  —  Y  Rival',
    cellFill(C.gray), font(true, C.textLt, 12), null, align('center'));
  ws.getRow(row).height = 18; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1, 'Parciales: Q1: — – —    Q2: — – —    Q3: — – —    Q4: — – —',
    cellFill(C.gray), font(false, C.textLt, 10), null, align('center'));
  ws.getRow(row).height = 16; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  ws.getRow(row).height = 8; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1, '🏀  HOPPERS',
    cellFill(C.blue), font(true, C.white, 12), null, align('left'));
  ws.getRow(row).height = 20; row++;

  // Headers
  COLS.forEach((col, i) => {
    setCell(ws, row, i + 1, col.header,
      cellFill(C.navy), font(true, C.gold, 10),
      border('thin'), align('center'));
  });
  ws.getRow(row).height = 16; row++;

  const dataStart = row;

  // 15 blank player rows with PTS formula
  for (let i = 0; i < 15; i++) {
    COLS.forEach((col, ci) => {
      let val = '';
      setCell(ws, row, ci + 1, val,
        cellFill(i % 2 === 0 ? C.white : C.gray),
        font(false, C.text, 10), border('thin'),
        align(ci === 1 ? 'left' : 'center'));
    });
    // PTS formula
    const scCol = colLetter(4), dcCol = colLetter(6), tcCol = colLetter(8);
    const ptsCol = colLetter(19);
    ws.getCell(`${ptsCol}${row}`).value = { formula: `${scCol}${row}*1+${dcCol}${row}*2+${tcCol}${row}*3` };
    ws.getRow(row).height = 15; row++;
  }

  const dataEnd = row - 1;

  // Totals row
  COLS.forEach((col, ci) => {
    const isNombre = ci === 1, isNumero = ci === 0, isMin = ci === 2, isVal = ci === 19;
    let val;
    if (isNombre) { val = 'TOTALES'; }
    else if (isNumero || isMin || isVal) { val = ''; }
    else {
      const colL = colLetter(ci + 1);
      val = { formula: `SUM(${colL}${dataStart}:${colL}${dataEnd})` };
    }
    setCell(ws, row, ci + 1, val,
      cellFill(C.navy), font(true, C.gold, 10),
      boldBorder('medium'), align(ci === 1 ? 'left' : 'center'));
  });
  ws.getRow(row).height = 16; row++;

  // Eficiencia row (empty, to fill)
  ws.mergeCells(row, 1, row, 3);
  setCell(ws, row, 1, 'Eficiencia Hoppers', cellFill(C.blueLt), font(true, C.blue, 9), border('thin'), align('left'));
  ['SC: —%', 'DC: —%', 'TC: —%'].forEach((txt, k) => {
    const c = 4 + k * 2;
    setCell(ws, row, c, txt, cellFill(C.blueLt), font(false, C.text, 9), border('thin'), align('center'));
    ws.mergeCells(row, c, row, c + 1);
  });
  ws.mergeCells(row, 10, row, NCOLS);
  ws.getRow(row).height = 14; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  ws.getRow(row).height = 10; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1, '🏀  RIVAL',
    cellFill(C.text), font(true, C.white, 12), null, align('left'));
  ws.getRow(row).height = 20; row++;

  const rivalHeaders = ['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'TOTAL', 'SC%', 'DC%', 'TC%'];
  rivalHeaders.forEach((h, i) => {
    setCell(ws, row, i + 1, h, cellFill(C.gray2), font(true, C.navy, 10), border('thin'), align('center'));
  });
  ws.mergeCells(row, rivalHeaders.length + 1, row, NCOLS);
  ws.getRow(row).height = 16; row++;

  rivalHeaders.forEach((_, i) => {
    setCell(ws, row, i + 1, '', cellFill(C.white), font(false, C.text, 10), border('thin'), align('center'));
  });
  ws.mergeCells(row, rivalHeaders.length + 1, row, NCOLS);
  ws.getRow(row).height = 15; row++;

  ws.mergeCells(row, 1, row, NCOLS);
  setCell(ws, row, 1,
    'Nota: estadísticas individuales del rival no registradas en planilla.',
    cellFill(C.gray), font(false, C.textLt, 9), null, align('left'));
  ws.getRow(row).height = 13;

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 8, activeCell: 'A9' }];
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1 };

  return ws;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Hoppers Analytics · Claude Sonnet';
  wb.created = new Date();
  wb.subject = 'Torneo Star Córdoba 2026';

  // One sheet per fecha
  db.fechas.forEach(f => buildFechaSheet(wb, f));

  // Template sheet last
  buildTemplateSheet(wb);

  const outPath = path.join('data', 'planillas_hoppers_2026.xlsx');
  await wb.xlsx.writeFile(outPath);
  console.log('Excel generado:', outPath);
}

main().catch(console.error);
