/********** 60_GCIA_ImportManual.gs **********/

function GCIA_uiImportarBloco() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt(
    "Importar bloco GCIA",
    "Cole aqui o bloco GCIA (PACK + POSTs) e clique em OK.",
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  const texto = (resp.getResponseText() || "").trim();
  if (!texto) return ui.alert("Nada foi colado.");

  const meta = { origem: "manual_prompt", chatId: "", fromId: "", messageId: "" };
  const result = GCIA_processarBloco_(texto, meta);

  ui.alert(`Importação concluída ✅\nPosts: ${result.posts}\nAtualizados: ${result.updated}\nNovos: ${result.inserted}\nErros: ${result.errors}`);
}
