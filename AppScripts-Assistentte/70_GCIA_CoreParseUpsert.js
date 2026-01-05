/********** 70_GCIA_CoreParseUpsert.gs **********/

/**
 * Fluxo manual/HTTP (Opção B): grava RAW e processa.
 */
function GCIA_processarBloco_(textoBruto, meta) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shRaw = ss.getSheetByName(GCIA_SHEETS_.RAW);
  const shPosts = ss.getSheetByName(GCIA_SHEETS_.POSTS);
  if (!shRaw || !shPosts) throw new Error("Rode GCIA_setupMatriz() antes.");

  const rawId = makeRawId_();
  const recebidoEm = new Date();

  // grava RAW
  const rawRow = {
    RawId: rawId,
    RecebidoEm: recebidoEm,
    Origem: meta.origem || "desconhecida",
    ChatId: meta.chatId || "",
    FromId: meta.fromId || "",
    MessageId: meta.messageId || "",
    TextoBruto: textoBruto,
    ParseStatus: "",
    ParseErros: "",
  };
  const rawRowIndex = appendObjectRow_(shRaw, GCIA_HEADERS_.RAW, rawRow);

  // processa e marca status na própria linha
  const out = GCIA_processarTextoEmPosts_(textoBruto, rawId);
  const rawMap = getHeaderMap_(shRaw, GCIA_HEADERS_.RAW);

  shRaw.getRange(rawRowIndex, rawMap["ParseStatus"]).setValue(out.ok ? "OK" : "ERRO");
  shRaw.getRange(rawRowIndex, rawMap["ParseErros"]).setValue(out.ok ? "" : out.error);

  return {
    posts: out.posts,
    inserted: out.inserted,
    updated: out.updated,
    errors: out.errors,
  };
}

/**
 * Opção A: processa uma linha já existente no GCIA_RAW (vinda do Make),
 * SEM criar nova linha no RAW.
 */
function GCIA_processarRawRow_(rawRowIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shRaw = ss.getSheetByName(GCIA_SHEETS_.RAW);
  const rawMap = getHeaderMap_(shRaw, GCIA_HEADERS_.RAW);

  const row = shRaw.getRange(rawRowIndex, 1, 1, shRaw.getLastColumn()).getValues()[0];
  const rawId = String(row[rawMap["RawId"] - 1] || "").trim();
  const texto = String(row[rawMap["TextoBruto"] - 1] || "").trim();

  if (!texto) {
    shRaw.getRange(rawRowIndex, rawMap["ParseStatus"]).setValue("ERRO");
    shRaw.getRange(rawRowIndex, rawMap["ParseErros"]).setValue("TextoBruto vazio.");
    return { ok: false, posts: 0, inserted: 0, updated: 0, errors: 1, error: "TextoBruto vazio." };
  }

  const out = GCIA_processarTextoEmPosts_(texto, rawId);

  shRaw.getRange(rawRowIndex, rawMap["ParseStatus"]).setValue(out.ok ? "OK" : "ERRO");
  shRaw.getRange(rawRowIndex, rawMap["ParseErros"]).setValue(out.ok ? "" : out.error);

  return out;
}

/**
 * Núcleo: parse + upsert em GCIA_POSTS (não grava RAW)
 */
function GCIA_processarTextoEmPosts_(textoBruto, rawId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shPosts = ss.getSheetByName(GCIA_SHEETS_.POSTS);

  let pack = {};
  let posts = [];
  let errors = [];

  try {
    ({ pack, posts } = GCIA_parsePackPosts_(textoBruto));
    if (!posts.length) throw new Error("Nenhuma linha GCIA|POST encontrada no bloco.");

    const headers = getHeaderMap_(shPosts, GCIA_HEADERS_.POSTS);
    const idCol = headers["ID"];
    if (!idCol) throw new Error("Coluna ID não encontrada em GCIA_POSTS.");

    const idToRow = GCIA_buildIdIndex_(shPosts, idCol);

    let inserted = 0;
    let updated = 0;

    for (const p of posts) {
      const id = String(p.ID || "").trim();
      if (!id) { errors.push("POST sem ID (ignorado)."); continue; }

      const rowObj = normalizePostObject_(p, rawId);

      if (idToRow.has(id)) {
        updateRowByIdPreservingOps_(shPosts, headers, idToRow.get(id), rowObj);
        updated++;
      } else {
        appendObjectRow_(shPosts, GCIA_HEADERS_.POSTS, rowObj);
        inserted++;
        idToRow.set(id, shPosts.getLastRow());
      }
    }

    return { ok: true, posts: posts.length, inserted, updated, errors: errors.length };
  } catch (e) {
    return { ok: false, posts: 0, inserted: 0, updated: 0, errors: 1, error: String(e && e.message ? e.message : e) };
  }
}

function GCIA_parsePackPosts_(textoBruto) {
  const lines = textoBruto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let pack = {};
  let posts = [];

  for (const line of lines) {
    const parsed = parseGciaLine_(line);
    if (!parsed) continue;

    if (parsed.type === "PACK") {
      pack = { ...pack, ...parsed.fields };
    } else if (parsed.type === "POST") {
      posts.push({ ...pack, ...parsed.fields });
    }
  }

  return { pack, posts };
}

function GCIA_buildIdIndex_(shPosts, idCol) {
  const lastRow = shPosts.getLastRow();
  const idValues = lastRow >= 2 ? shPosts.getRange(2, idCol, lastRow - 1, 1).getValues().flat() : [];
  const idToRow = new Map();
  idValues.forEach((val, i) => {
    const id = String(val || "").trim();
    if (id) idToRow.set(id, i + 2);
  });
  return idToRow;
}

function parseGciaLine_(line) {
  if (!line.startsWith("GCIA|")) return null;
  const parts = line.split("|");
  if (parts.length < 3) return null;

  const type = parts[1];
  if (type !== "PACK" && type !== "POST") return null;

  const fields = {};
  for (let i = 3; i < parts.length; i++) {
    const token = parts[i];
    const eq = token.indexOf("=");
    if (eq <= 0) continue;
    const key = token.substring(0, eq).trim();
    const val = token.substring(eq + 1).trim();
    if (key) fields[key] = val;
  }

  return { type, fields };
}

function normalizePostObject_(p, rawId) {
  const now = new Date();

  let dateObj = "";
  if (typeof p.DATA === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.DATA)) {
    const [y, m, d] = p.DATA.split("-").map(n => parseInt(n, 10));
    dateObj = new Date(y, m - 1, d);
  }

  const obj = {
    ...p,
    DATA: dateObj || (p.DATA || ""),
    RAW_ID_ORIGEM: rawId,
    INSERIDO_EM: now,
  };

  if (!obj.STATUS) obj.STATUS = "IDEIA";
  return obj;
}

function updateRowByIdPreservingOps_(shPosts, headerMap, rowIndex, rowObj) {
  const lastCol = shPosts.getLastColumn();
  const current = shPosts.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
  const headersRow = shPosts.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim());

  const newRow = current.slice();

  headersRow.forEach((h, idx) => {
    if (!h) return;
    if (!(h in rowObj)) return;

    const incoming = rowObj[h];

    if (GCIA_OP_FIELDS_.has(h)) {
      const already = String(current[idx] || "").trim();
      const incStr = String(incoming || "").trim();
      if (already && !incStr) return; // preserva
      newRow[idx] = incoming;
      return;
    }

    newRow[idx] = incoming;
  });

  shPosts.getRange(rowIndex, 1, 1, lastCol).setValues([newRow]);
}
