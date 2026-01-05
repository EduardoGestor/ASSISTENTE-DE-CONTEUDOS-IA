/********** 50_GCIA_Calendar.gs **********/

function setupCalendarView_(shCal) {
  const formula =
    `=QUERY(${GCIA_SHEETS_.POSTS}!A:ZZ;` +
    `"select Col7, Col8, Col9, Col10, Col13, Col22, Col23, Col1 ` +
    `where Col1 is not null ` +
    `order by Col7 asc ` +
    `label Col7 'DATA', Col8 'DIA', Col9 'TIPO', Col10 'SERIE', Col13 'TEMA', Col22 'STATUS', Col23 'LINK_ARTE', Col1 'ID'"` +
    `;1)`;

  shCal.clear();
  shCal.getRange("A1").setFormula(formula);
  shCal.setFrozenRows(1);
  shCal.setColumnWidth(1, 110);
  shCal.setColumnWidth(5, 420);
}
