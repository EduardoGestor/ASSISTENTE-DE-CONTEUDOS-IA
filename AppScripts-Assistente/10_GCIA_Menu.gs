/********** 10_GCIA_Menu.gs **********/

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("GCIA")
    .addItem("✅ Setup / Atualizar estrutura", "GCIA_setupMatriz")
    .addSeparator()
    .addItem("📥 Importar bloco GCIA (colar no prompt)", "GCIA_uiImportarBloco")
    .addSeparator()
    .addItem("⚙️ Processar pendentes do GCIA_RAW (agora)", "GCIA_processarPendentesAgora")
    .addItem("⏱️ Instalar/atualizar gatilho (1 min)", "GCIA_install")
    .addToUi();
}
