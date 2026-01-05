/********** 30_GCIA_ConfigLists.gs **********/

function fillConfigLists_(shCfg) {
  const headers = GCIA_HEADERS_.CONFIG;
  const map = getHeaderMap_(shCfg, headers);

  headers.forEach((key) => {
    const col = map[key];
    if (!col) return;

    const existing = shCfg.getRange(2, col, shCfg.getMaxRows() - 1, 1)
      .getValues().flat().filter(v => String(v || "").trim());
    if (existing.length) return;

    const items = GCIA_DEFAULT_LISTS_[key] || [];
    if (!items.length) return;

    shCfg.getRange(2, col, items.length, 1).setValues(items.map(v => [v]));
    shCfg.setColumnWidth(col, 180);
  });

  shCfg.getRange(1, 1, 1, shCfg.getLastColumn()).setHorizontalAlignment("center");
}

function createOrUpdateNamedRanges_(ss, shCfg) {
  const map = getHeaderMap_(shCfg, GCIA_HEADERS_.CONFIG);

  GCIA_HEADERS_.CONFIG.forEach((key) => {
    const col = map[key];
    if (!col) return;

    const last = findLastNonEmptyInColumn_(shCfg, col);
    const name = `GCIA_LIST_${key}`;
    const range = shCfg.getRange(2, col, Math.max(last - 1, 1), 1);

    const existing = ss.getNamedRanges().find(nr => nr.getName() === name);
    if (existing) existing.remove();
    ss.setNamedRange(name, range);
  });
}
