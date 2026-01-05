/********** 80_GCIA_Pendencias_OptionA.gs **********/

function GCIA_install() {
  // remove gatilhos antigos do mesmo handler
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "GCIA_processarPendentes") ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger("GCIA_processarPendentes")
    .timeBased()
    .everyMinutes(1)
    .create();

  SpreadsheetApp.getUi().alert("✅ Gatilho instalado: GCIA_processarPendentes a cada 1 minuto.");
}

function GCIA_processarPendentesAgora() {
  const r = GCIA_processarPendentes();
  SpreadsheetApp.getUi().alert(
    `✅ Processamento concluído.\n` +
    `Processadas: ${r.processadas}\n` +
    `OK: ${r.ok}\n` +
    `Erros: ${r.erros}\n` +
    `Inseridos: ${r.inserted}\n` +
    `Atualizados: ${r.updated}`
  );
}

function GCIA_processarPendentes() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) {
    return { processadas: 0, ok: 0, erros: 0, inserted: 0, updated: 0, lock: "busy" };
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shRaw = ss.getSheetByName(GCIA_SHEETS_.RAW);
    if (!shRaw) throw new Error("Aba GCIA_RAW não existe.");

    const rawMap = getHeaderMap_(shRaw, GCIA_HEADERS_.RAW);

    const lastRow = shRaw.getLastRow();
    if (lastRow < 2) return { processadas: 0, ok: 0, erros: 0, inserted: 0, updated: 0 };

    // lê tudo de uma vez (mais rápido)
    const values = shRaw.getRange(2, 1, lastRow - 1, shRaw.getLastColumn()).getValues();

    let processadas = 0, ok = 0, erros = 0, inserted = 0, updated = 0;

    for (let i = 0; i < values.length; i++) {
      if (processadas >= GCIA_BATCH_LIMIT_) break;

      const rowIndex = i + 2;
      const parseStatus = String(values[i][rawMap["ParseStatus"] - 1] || "").trim();

      if (parseStatus) continue; // já processado

      const out = GCIA_processarRawRow_(rowIndex);

      processadas++;
      if (out.ok) ok++; else erros++;

      inserted += (out.inserted || 0);
      updated += (out.updated || 0);
    }

    return { processadas, ok, erros, inserted, updated };
  } finally {
    lock.releaseLock();
  }
}
