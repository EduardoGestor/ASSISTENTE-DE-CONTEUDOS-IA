/********** 20_GCIA_Setup.gs **********/

function GCIA_setupMatriz() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const shRaw = ensureSheet_(ss, GCIA_SHEETS_.RAW);
  const shPosts = ensureSheet_(ss, GCIA_SHEETS_.POSTS);
  const shCfg = ensureSheet_(ss, GCIA_SHEETS_.CONFIG);
  const shCal = ensureSheet_(ss, GCIA_SHEETS_.CAL);

  // Cabeçalhos
  ensureHeaders_(shRaw, GCIA_HEADERS_.RAW);
  ensureHeaders_(shPosts, GCIA_HEADERS_.POSTS);
  ensureHeaders_(shCfg, GCIA_HEADERS_.CONFIG);

  // Estilos
  styleHeaderRow_(shRaw);
  styleHeaderRow_(shPosts);
  styleHeaderRow_(shCfg);
  shRaw.setFrozenRows(1);
  shPosts.setFrozenRows(1);
  shCfg.setFrozenRows(1);

  // Formatos
  formatRawSheet_(shRaw);
  formatPostsSheet_(shPosts);

  // CONFIG + named ranges
  fillConfigLists_(shCfg);
  createOrUpdateNamedRanges_(ss, shCfg);

  // Validações e condicional
  applyPostsValidations_(shPosts);
  applyPostsConditionalFormatting_(shPosts);

  // Calendário (visão)
  setupCalendarView_(shCal);

  // Filtros
  safeCreateFilter_(shRaw);
  safeCreateFilter_(shPosts);
  safeCreateFilter_(shCal);

  SpreadsheetApp.getUi().alert("GCIA: Estrutura aplicada com sucesso ✅");
}

function ensureSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function ensureHeaders_(sheet, requiredHeaders) {
  const existing = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
  const existingTrim = existing.map((h) => String(h || "").trim());
  const hasAny = existingTrim.some((h) => h.length > 0);

  if (!hasAny) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sheet.setFrozenRows(1);
    return;
  }

  const existingSet = new Set(existingTrim.filter(Boolean));
  const toAppend = [];
  for (const h of requiredHeaders) if (!existingSet.has(h)) toAppend.push(h);

  if (toAppend.length) {
    const lastCol = sheet.getLastColumn();
    sheet.getRange(1, lastCol + 1, 1, toAppend.length).setValues([toAppend]);
  }
}

function styleHeaderRow_(sheet) {
  const lastCol = sheet.getLastColumn();
  const rg = sheet.getRange(1, 1, 1, lastCol);
  rg.setFontWeight("bold");
  rg.setWrap(true);
  rg.setVerticalAlignment("middle");
}

function safeCreateFilter_(sheet) {
  try {
    if (sheet.getFilter()) return;
    const lastCol = sheet.getLastColumn();
    sheet.getRange(1, 1, 1, lastCol).createFilter();
  } catch (e) {}
}

function formatRawSheet_(sh) {
  const map = getHeaderMap_(sh, GCIA_HEADERS_.RAW);
  if (map["TextoBruto"]) sh.setColumnWidth(map["TextoBruto"], 800);
  if (map["ParseErros"]) sh.setColumnWidth(map["ParseErros"], 450);

  if (map["RecebidoEm"]) {
    sh.getRange(2, map["RecebidoEm"], Math.max(sh.getMaxRows() - 1, 1), 1)
      .setNumberFormat("yyyy-mm-dd hh:mm");
  }
}

function formatPostsSheet_(sh) {
  const map = getHeaderMap_(sh, GCIA_HEADERS_.POSTS);

  if (map["DATA"]) {
    sh.getRange(2, map["DATA"], Math.max(sh.getMaxRows() - 1, 1), 1)
      .setNumberFormat("yyyy-mm-dd");
  }
  if (map["INSERIDO_EM"]) {
    sh.getRange(2, map["INSERIDO_EM"], Math.max(sh.getMaxRows() - 1, 1), 1)
      .setNumberFormat("yyyy-mm-dd hh:mm");
  }

  const widen = (name, width) => { if (map[name]) sh.setColumnWidth(map[name], width); };
  widen("ID", 260);
  widen("TEMA", 360);
  widen("GANCHO", 360);
  widen("BRIEF", 420);
  widen("ROTEIRO", 520);
  widen("CTA", 360);
  widen("LINK_ARTE", 260);
  widen("LINK_POSTADO", 260);

  // Fórmula DIA_SEMANA em pt-BR (com ; e UPPER)
  if (map["DIA_SEMANA"] && map["DATA"]) {
    const cell = sh.getRange(2, map["DIA_SEMANA"]);
    const hasFormula = String(cell.getFormula() || "").length > 0;
    if (!hasFormula) {
      const dataCol = colToLetter_(map["DATA"]);
      cell.setFormula(
        `=ARRAYFORMULA(IF(LEN(${dataCol}2:${dataCol})=0;"";UPPER(TEXT(${dataCol}2:${dataCol};"ddd"))))`
      );
      sh.getRange(2, map["DIA_SEMANA"], Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat("@");
    }
  }

  ["TEMA", "GANCHO", "BRIEF", "ROTEIRO", "CTA"].forEach((h) => {
    if (map[h]) sh.getRange(2, map[h], Math.max(sh.getMaxRows() - 1, 1), 1).setWrap(true);
  });
}
