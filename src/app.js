import {
  CHAVE_CACHE,
  CHAVE_HISTORICO,
  MOEDAS,
  MOEDAS_ORDEM,
  PARES_API,
  REFERENCIA_EM,
  TAXAS_REFERENCIA,
  TTL_CACHE_MS,
  cacheValido,
  converter,
  formatarMoeda,
  formatarTaxa,
  formatarVariacao,
  idadeRelativa,
  moedasDisponiveis,
  normalizarResposta,
  taxaEntre,
} from "./rates.js";

const URL_API = `https://economia.awesomeapi.com.br/json/last/${PARES_API.map(
  (moeda) => `${moeda}-BRL`
).join(",")}`;
const LIMITE_HISTORICO = 6;

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

const estado = {
  taxas: TAXAS_REFERENCIA,
  variacoes: {},
  fonte: "referencia",
  atualizadoEm: REFERENCIA_EM,
  origem: "USD",
  destino: "BRL",
  carregando: false,
};

/* Utilitários ------------------------------------------------------------ */

function paraCentavos(texto) {
  const digitos = String(texto ?? "").replace(/\D/g, "");
  return digitos ? Number.parseInt(digitos, 10) : 0;
}

function formatarNumero(centavos) {
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function valorAtual() {
  return paraCentavos($("#valor").value) / 100;
}

function anunciar(mensagem) {
  $("#anuncio").textContent = mensagem;
}

/* Cache ------------------------------------------------------------------ */

function lerCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(CHAVE_CACHE) ?? "null");
    if (!cache || typeof cache !== "object") return null;
    if (!cacheValido(Number(cache.salvoEm))) return null;
    if (!cache.taxas || typeof cache.taxas !== "object") return null;
    return cache;
  } catch {
    return null;
  }
}

function salvarCache(dados) {
  try {
    localStorage.setItem(
      CHAVE_CACHE,
      JSON.stringify({ ...dados, salvoEm: Date.now() })
    );
  } catch {
    // Sem armazenamento (modo privado): segue usando apenas o estado em memória.
  }
}

/* Busca de cotações ------------------------------------------------------ */

async function buscarCotacoes({ sinal } = {}) {
  const controlador = new AbortController();
  const timeout = window.setTimeout(() => controlador.abort(), 9000);

  try {
    const resposta = await fetch(URL_API, {
      signal: sinal ?? controlador.signal,
      headers: { accept: "application/json" },
    });

    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

    const dados = normalizarResposta(await resposta.json());
    estado.taxas = dados.taxas;
    estado.variacoes = dados.variacoes;
    estado.atualizadoEm = dados.atualizadoEm ?? new Date().toISOString();
    estado.fonte = "live";

    salvarCache({
      taxas: dados.taxas,
      variacoes: dados.variacoes,
      atualizadoEm: estado.atualizadoEm,
    });
  } catch (erro) {
    if (erro.name === "AbortError") return;
    // Nunca apresentamos dado antigo como se fosse cotação ao vivo.
    estado.fonte = "offline";
  } finally {
    window.clearTimeout(timeout);
    estado.carregando = false;
    renderizarTudo();
  }
}

async function carregar() {
  const cache = lerCache();

  if (cache) {
    estado.taxas = cache.taxas;
    estado.variacoes = cache.variacoes ?? {};
    estado.atualizadoEm = cache.atualizadoEm;
    estado.fonte = "cache";
  }

  estado.carregando = true;
  renderizarTudo();
  await buscarCotacoes();
}

/* Renderização ----------------------------------------------------------- */

function preencherSelects() {
  for (const id of ["#moeda-origem", "#moeda-destino"]) {
    const select = $(id);
    if (select.options.length) continue;
    select.replaceChildren(
      ...MOEDAS_ORDEM.map((codigo) => {
        const option = document.createElement("option");
        option.value = codigo;
        option.textContent = `${codigo} — ${MOEDAS[codigo].nome}`;
        return option;
      })
    );
  }

  $("#moeda-origem").value = estado.origem;
  $("#moeda-destino").value = estado.destino;
}

function renderizarStatus() {
  const status = $("#status");
  const chip = $("#fonte-chip");
  const aviso = $("#aviso-fonte");
  const atualizado = $("#atualizado");

  const idade = idadeRelativa(estado.atualizadoEm);

  if (estado.carregando) {
    status.dataset.estado = "carregando";
    $("#status-texto").textContent = "buscando cotações";
    chip.textContent = "atualizando";
  } else if (estado.fonte === "live") {
    status.dataset.estado = "live";
    $("#status-texto").textContent = "cotação ao vivo";
    chip.textContent = "cotação ao vivo";
  } else if (estado.fonte === "cache") {
    status.dataset.estado = "cache";
    $("#status-texto").textContent = "última cotação salva";
    chip.textContent = "cache local";
    chip.dataset.estado = "cache";
  } else {
    status.dataset.estado = "offline";
    $("#status-texto").textContent = "modo offline";
    chip.textContent = "valores de referência";
    chip.dataset.estado = "offline";
  }

  if (estado.fonte === "cache") chip.dataset.estado = "cache";
  else if (estado.fonte === "offline") chip.dataset.estado = "offline";
  else delete chip.dataset.estado;

  aviso.hidden = estado.fonte === "live" || estado.carregando;
  atualizado.textContent =
    estado.fonte === "live"
      ? `Cotação atualizada ${idade}`
      : `Última cotação conhecida: ${idade}`;
  $("#painel-atualizado").textContent =
    estado.fonte === "live" ? `atualizado ${idade}` : `referência ${idade}`;
}

function renderizarConversao() {
  const bruto = valorAtual();
  const { origem, destino, taxas } = estado;

  let convertido = 0;
  let taxa = 0;

  try {
    taxa = taxaEntre(origem, destino, taxas);
    convertido = converter(bruto, origem, destino, taxas);
  } catch {
    $("#resultado").textContent = "—";
    $("#resultado-legenda").textContent = "Cotação indisponível para este par.";
    $("#taxa-unitária").textContent = "—";
    return;
  }

  $("#simbolo-origem").textContent = MOEDAS[origem].simbolo;
  $("#resultado").textContent = formatarMoeda(convertido, destino);
  $("#resultado-legenda").textContent = `${formatarMoeda(bruto, origem)} · ${
    MOEDAS[origem].nome
  }`;
  $("#taxa-unitária").textContent = `1 ${origem} = ${formatarTaxa(taxa, destino)}`;
  $("#taxa-atualizada").textContent = idadeRelativa(estado.atualizadoEm);
}

function renderizarPainel() {
  const painel = $("#painel-moedas");
  const disponiveis = moedasDisponiveis(estado.taxas).filter(
    (codigo) => codigo !== "BRL"
  );

  painel.replaceChildren();

  for (const codigo of disponiveis) {
    const moeda = MOEDAS[codigo];
    const taxa = estado.taxas[codigo];
    const variacao = estado.variacoes[codigo]?.percentual ?? 0;
    const sinal = variacao > 0.0001 ? "up" : variacao < -0.0001 ? "down" : "flat";

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "rate-card";
    botao.dataset.moeda = codigo;
    botao.setAttribute("aria-pressed", String(codigo === estado.destino));
    botao.setAttribute(
      "aria-label",
      `Usar ${moeda.nome} como moeda de destino. Cotação ${formatarTaxa(taxa, "BRL")} por 1 ${codigo}, variação de ${formatarVariacao(variacao)} no dia.`
    );

    botao.innerHTML = `
      <span class="rate-card-head">
        <span class="rate-code"><span class="flag" aria-hidden="true">${moeda.bandeira}</span>${codigo}</span>
        <span class="variation" data-sinal="${sinal}">${formatarVariacao(variacao)}</span>
      </span>
      <span class="rate-value">${formatarTaxa(taxa, "BRL")}</span>
      <span class="rate-name">${moeda.nome}</span>
    `;

    botao.addEventListener("click", () => {
      if (codigo === estado.origem) {
        estado.origem = estado.destino;
      }
      estado.destino = codigo;
      $("#moeda-origem").value = estado.origem;
      $("#moeda-destino").value = estado.destino;
      renderizarTudo();
      anunciar(`${moeda.nome} selecionado como moeda de destino.`);
    });

    painel.append(botao);
  }

  if (!disponiveis.length) {
    const vazio = document.createElement("p");
    vazio.className = "empty";
    vazio.textContent = "Nenhuma cotação disponível no momento.";
    painel.append(vazio);
  }
}

function renderizarTudo() {
  preencherSelects();
  renderizarStatus();
  renderizarConversao();
  renderizarPainel();
}

/* Histórico -------------------------------------------------------------- */

function carregarHistorico() {
  try {
    const itens = JSON.parse(localStorage.getItem(CHAVE_HISTORICO) ?? "[]");
    return Array.isArray(itens) ? itens.filter((item) => item && item.id) : [];
  } catch {
    return [];
  }
}

function salvarHistorico(itens) {
  try {
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(itens));
  } catch {
    // Ignora falhas de armazenamento.
  }
}

function registrarConversao() {
  const bruto = valorAtual();
  const { origem, destino, taxas } = estado;
  const convertido = converter(bruto, origem, destino, taxas);
  const item = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    em: new Date().toISOString(),
    valor: bruto,
    origem,
    destino,
    convertido,
    taxa: taxaEntre(origem, destino, taxas),
  };

  const historico = [item, ...carregarHistorico()].slice(0, LIMITE_HISTORICO);
  salvarHistorico(historico);
  renderizarHistorico(historico);
  anunciar(
    `Conversão salva: ${formatarMoeda(convertido, destino)}.`
  );
}

function renderizarHistorico(itens = carregarHistorico()) {
  const lista = $("#historico");
  const vazio = $("#historico-vazio");
  lista.replaceChildren();
  vazio.hidden = itens.length > 0;

  for (const item of itens) {
    const li = document.createElement("li");

    const descricao = document.createElement("span");
    descricao.className = "history-conversion";
    descricao.innerHTML = `${formatarMoeda(item.valor, item.origem)} → <strong>${formatarMoeda(
      item.convertido,
      item.destino
    )}</strong> <span class="muted">${item.origem}/${item.destino}</span>`;

    const lado = document.createElement("span");
    lado.className = "history-side";

    const tempo = document.createElement("time");
    tempo.dateTime = item.em;
    tempo.textContent = new Date(item.em).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const repetir = document.createElement("button");
    repetir.type = "button";
    repetir.className = "btn btn-small btn-ghost";
    repetir.textContent = "Repetir";
    repetir.setAttribute(
      "aria-label",
      `Repetir conversão de ${formatarMoeda(item.valor, item.origem)} para ${item.destino}`
    );
    repetir.addEventListener("click", () => {
      estado.origem = item.origem;
      estado.destino = item.destino;
      $("#valor").value = formatarNumero(Math.round(item.valor * 100));
      $("#moeda-origem").value = item.origem;
      $("#moeda-destino").value = item.destino;
      renderizarTudo();
      $("#valor").focus();
    });

    lado.append(tempo, repetir);
    li.append(descricao, lado);
    lista.append(li);
  }
}

/* Ações ------------------------------------------------------------------ */

async function copiarResultado() {
  const texto = `${formatarMoeda(valorAtual(), estado.origem)} = ${$("#resultado").textContent} (${
    $("#taxa-unitária").textContent
  }, ${idadeRelativa(estado.atualizadoEm)})`;
  const botao = $("#btn-copiar");

  try {
    await navigator.clipboard.writeText(texto);
    botao.textContent = "Copiado!";
    anunciar("Resultado copiado para a área de transferência.");
  } catch {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const copiou = document.execCommand?.("copy");
    area.remove();
    botao.textContent = copiou ? "Copiado!" : "Não foi possível copiar";
  }

  window.setTimeout(() => {
    botao.textContent = "Copiar resultado";
  }, 2200);
}

/* Inicialização ---------------------------------------------------------- */

function iniciar() {
  const input = $("#valor");

  const aplicarMascara = () => {
    input.value = formatarNumero(paraCentavos(input.value));
  };

  input.addEventListener("input", () => {
    aplicarMascara();
    renderizarConversao();
  });
  input.addEventListener("focus", () => input.select());
  input.addEventListener("blur", aplicarMascara);
  aplicarMascara();

  $("#form-conversao").addEventListener("submit", (evento) => {
    evento.preventDefault();
    renderizarConversao();
    registrarConversao();
  });

  $("#moeda-origem").addEventListener("change", (evento) => {
    estado.origem = evento.target.value;
    renderizarConversao();
    renderizarPainel();
  });

  $("#moeda-destino").addEventListener("change", (evento) => {
    estado.destino = evento.target.value;
    renderizarConversao();
    renderizarPainel();
  });

  $("#btn-inverter").addEventListener("click", () => {
    [estado.origem, estado.destino] = [estado.destino, estado.origem];
    $("#moeda-origem").value = estado.origem;
    $("#moeda-destino").value = estado.destino;
    renderizarTudo();
    anunciar("Moedas de origem e destino invertidas.");
  });

  $("#btn-copiar").addEventListener("click", copiarResultado);

  $("#btn-atualizar").addEventListener("click", async (evento) => {
    const botao = evento.currentTarget;
    if (estado.carregando) return;

    estado.carregando = true;
    botao.dataset.carregando = "true";
    renderizarStatus();

    await buscarCotacoes();

    botao.dataset.carregando = "false";
    anunciar("Cotações atualizadas.");
  });

  $("#btn-limpar-historico").addEventListener("click", () => {
    salvarHistorico([]);
    renderizarHistorico([]);
    anunciar("Histórico de conversões limpo.");
  });

  renderizarHistorico();
  carregar();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
}

// Exportado para eventual uso em testes de integração no navegador.
export { estado, TTL_CACHE_MS };
