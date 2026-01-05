/********** 40_GCIA_Validations.gs **********/

function applyPostsValidations_(shPosts) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pMap = getHeaderMap_(shPosts, GCIA_HEADERS_.POSTS);

  ensureMinRows_(shPosts, 3000);

  const dropdownCols = ["PERFIL", "TIPO", "SERIE", "PILAR", "OBJ", "RISCO", "VERIF", "FONTE", "STATUS"];

  dropdownCols.forEach((key) => {
    const col = pMap[key];
    if (!col) return;

    const named = ss.getNamedRanges().find(nr => nr.getName() === `GCIA_LIST_${key}`);
    if (!named) return;

    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(named.getRange(), true)
      .setAllowInvalid(true)
      .build();

    shPosts.getRange(2, col, shPosts.getMaxRows() - 1, 1).setDataValidation(rule);
  });

  if (pMap["DATA"]) {
    const ruleDate = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true).build();
    shPosts.getRange(2, pMap["DATA"], shPosts.getMaxRows() - 1, 1).setDataValidation(ruleDate);
  }
}

function applyPostsConditionalFormatting_(shPosts) {
  const map = getHeaderMap_(shPosts, GCIA_HEADERS_.POSTS);
  const lastCol = shPosts.getLastColumn();
  const rangeAll = shPosts.getRange(2, 1, Math.max(shPosts.getMaxRows() - 1, 1), lastCol);

  const rules = [];

  if (map["STATUS"]) {
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=$${colToLetter_(map["STATUS"])}2="POSTADO"`)
        .setFontColor("#777777")
        .setRanges([rangeAll])
        .build()
    );
  }

  if (map["RISCO"]) {
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=$${colToLetter_(map["RISCO"])}2="ALTO"`)
        .setBold(true)
        .setRanges([rangeAll])
        .build()
    );
  }

  if (map["VERIF"]) {
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=AND(LEN($${colToLetter_(map["VERIF"])}2)>0;$${colToLetter_(map["VERIF"])}2<>"OK")`)
        .setBold(true)
        .setRanges([rangeAll])
        .build()
    );
  }

  shPosts.setConditionalFormatRules(rules);
}

function ensureMinRows_(sheet, minRows) {
  const cur = sheet.getMaxRows();
  if (cur < minRows) sheet.insertRowsAfter(cur, minRows - cur);
}
