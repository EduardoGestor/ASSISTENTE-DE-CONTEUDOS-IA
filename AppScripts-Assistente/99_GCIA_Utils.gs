/********** 99_GCIA_Utils.gs **********/

function getHeaderMap_(sheet, fallbackHeaders) {
  const lastCol = Math.max(sheet.getLastColumn(), fallbackHeaders.length);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim());
  const map = {};
  headers.forEach((h, i) => { if (h) map[h] = i + 1; });
  return map;
}

function appendObjectRow_(sheet, headers, obj) {
  const row = headers.map(h => (h in obj ? obj[h] : ""));
  const idx = sheet.getLastRow() + 1;
  sheet.getRange(idx, 1, 1, row.length).setValues([row]);
  return idx;
}

function findLastNonEmptyInColumn_(sheet, col) {
  const vals = sheet.getRange(2, col, sheet.getMaxRows() - 1, 1).getValues().flat();
  for (let i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i] || "").trim()) return i + 2;
  }
  return 2;
}

function makeRawId_() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) + "_" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  return `RAW_${stamp}_${Math.floor(Math.random() * 1e6)}`;
}

function colToLetter_(col) {
  let temp = "";
  let letter = "";
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}
