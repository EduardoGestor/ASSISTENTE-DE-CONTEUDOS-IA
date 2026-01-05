/********** 00_GCIA_Constants.gs **********/

const GCIA_SHEETS_ = {
  RAW: "GCIA_RAW",
  POSTS: "GCIA_POSTS",
  CONFIG: "CONFIG",
  CAL: "CALENDARIO",
};

const GCIA_HEADERS_ = {
  RAW: [
    "RawId",
    "RecebidoEm",
    "Origem",
    "ChatId",
    "FromId",
    "MessageId",
    "TextoBruto",
    "ParseStatus",
    "ParseErros",
  ],
  POSTS: [
    // Contexto
    "ID",
    "PERFIL",
    "COMP",
    "JANELA",
    "BASE",
    "SLOT",
    "DATA",
    "DIA_SEMANA",

    // Conteúdo
    "TIPO",
    "SERIE",
    "PILAR",
    "OBJ",
    "TEMA",
    "GANCHO",
    "BRIEF",
    "ROTEIRO",
    "CTA",
    "NOMEARQ",

    // Compliance
    "RISCO",
    "VERIF",
    "FONTE",

    // Operação
    "STATUS",
    "LINK_ARTE",
    "LINK_POSTADO",
    "OBS_OPERACAO",

    // Rastreio
    "RAW_ID_ORIGEM",
    "INSERIDO_EM",
  ],
  CONFIG: [
    "TIPO",
    "SERIE",
    "PILAR",
    "OBJ",
    "STATUS",
    "RISCO",
    "VERIF",
    "FONTE",
    "PERFIL",
  ],
};

const GCIA_DEFAULT_LISTS_ = {
  TIPO: ["ESTATICO", "VIDEO", "CARROSSEL", "STORY"],
  SERIE: [
    "GUIA_SALVAVEL",
    "DICA_RAPIDA",
    "MITO_VS_VERDADE",
    "MINI_AULA",
    "ALERTA_PRATICO",
    "BASTIDOR",
    "COMPROMISSO",
  ],
  PILAR: ["EDUCACAO", "DICA", "ALERTA", "BASTIDOR"],
  OBJ: ["SALVOS", "ALCANCE", "COMENTARIOS"],
  STATUS: ["IDEIA", "EM_ARTE", "REVISAO", "PRONTO", "POSTADO"],
  RISCO: ["BAIXO", "MEDIO", "ALTO"],
  VERIF: ["OK", "CHECAR"],
  FONTE: ["NAO_APLICA"],
  PERFIL: ["ANTUNES"],
};

// Campos operacionais que não devemos sobrescrever se já estiverem preenchidos
const GCIA_OP_FIELDS_ = new Set(["STATUS", "LINK_ARTE", "LINK_POSTADO", "OBS_OPERACAO"]);

// Opção A (worker)
const GCIA_BATCH_LIMIT_ = 20; // quantas linhas RAW processar por execução
