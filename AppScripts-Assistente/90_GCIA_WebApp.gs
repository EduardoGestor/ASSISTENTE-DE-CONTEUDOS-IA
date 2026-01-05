/********** 90_GCIA_WebApp.gs **********/

function doPost(e) {
  try {
    const payload = safeParseJson_(e && e.postData && e.postData.contents);
    if (!payload) return json_(400, { ok: false, error: "Payload JSON ausente ou inválido." });

    const token = String(payload.token || "").trim();
    const expected = String(PropertiesService.getScriptProperties().getProperty("GCIA_WEBHOOK_TOKEN") || "").trim();
    if (!expected) return json_(500, { ok: false, error: "GCIA_WEBHOOK_TOKEN não configurado nas Script Properties." });
    if (token !== expected) return json_(401, { ok: false, error: "Token inválido." });

    const textoBruto = String(payload.textoBruto || "").trim();
    if (!textoBruto) return json_(400, { ok: false, error: "textoBruto vazio." });

    const meta = {
      origem: payload.origem || "make",
      chatId: String(payload.chatId || ""),
      fromId: String(payload.fromId || ""),
      messageId: String(payload.messageId || ""),
    };

    const result = GCIA_processarBloco_(textoBruto, meta);
    return json_(200, { ok: true, ...result });

  } catch (err) {
    return json_(500, { ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function safeParseJson_(s) {
  try { return s ? JSON.parse(s) : null; } catch (e) { return null; }
}

function json_(code, obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
