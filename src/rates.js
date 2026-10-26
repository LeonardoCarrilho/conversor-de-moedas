/**
 * Regras de câmbio do conversor.
 *
 * A AwesomeAPI devolve cada par já em relação ao real (ex.: USDBRL.bid = reais
 * por dólar). Normalizamos tudo para uma tabela com base BRL — quantos reais
 * vale 1 unidade da moeda — e calculamos qualquer par por regra de três.
 */

export const MOEDAS = {
  BRL: { nome: "Real brasileiro", simbolo: "R$", bandeira: "🇧🇷" },
  USD: { nome: "Dólar americano", simbolo: "US$", bandeira: "🇺🇸" },
  EUR: { nome: "Euro", simbolo: "€", bandeira: "🇪🇺" },
  GBP: { nome: "Libra esterlina", simbolo: "£", bandeira: "🇬🇧" },
  JPY: { nome: "Iene japonês", simbolo: "¥", bandeira: "🇯🇵" },
  ARS: { nome: "Peso argentino", simbolo: "$", bandeira: "🇦🇷" },
  CAD: { nome: "Dólar canadense", simbolo: "C$", bandeira: "🇨🇦" },
  AUD: { nome: "Dólar australiano", simbolo: "A$", bandeira: "🇦🇺" },
  CHF: { nome: "Franco suíço", simbolo: "Fr", bandeira: "🇨🇭" },
};

/** Ordem exibida nos seletores e no painel de cotações. */
export const MOEDAS_ORDEM = ["BRL", "USD", "EUR", "GBP", "JPY", "ARS", "CAD", "AUD", "CHF"];

/** Pares consultados na API (todos cotados contra o real). */
export const PARES_API = ["USD", "EUR", "GBP", "JPY", "ARS", "CAD", "AUD", "CHF"];

/**
 * Última tabela conhecida, usada quando a API está indisponível.
 * Valores de referência de 26/10/2026 (reais por unidade).
 */
export const TAXAS_REFERENCIA = {
  BRL: 1,
  USD: 4.9652,
  EUR: 5.5973,
  GBP: 6.6477,
  JPY: 0.03163679,
  ARS: 0.00325571,
  CAD: 3.55018,
  AUD: 3.49632,
  CHF: 6.02906,
};

export const REFERENCIA_EM = "2026-10-26T09:57:24-03:00";
export const TTL_CACHE_MS = 15 * 60 * 1000;
export const CHAVE_CACHE = "conversor-moedas:cotacoes:v1";
export const CHAVE_HISTORICO = "conversor-moedas:historico:v1";

/**
 * Transforma a resposta da AwesomeAPI em uma tabela com base BRL.
 * @param {Record<string, {code?:string, codein?:string, bid:string, pctChange:string, timestamp:string}>} json
 */
export function normalizarResposta(json) {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new TypeError("Resposta de cotações inválida.");
  }

  const taxas = { BRL: 1 };
  const variacoes = {};
  const timestamps = [];

  for (const [chave, valor] of Object.entries(json)) {
    if (!valor || typeof valor !== "object") continue;

    const moeda = String(valor.code ?? chave.slice(0, 3)).toUpperCase();
    const destino = String(valor.codein ?? chave.slice(3)).toUpperCase();
    const taxa = Number(valor.bid);

    if (destino !== "BRL" || !MOEDAS[moeda] || moeda === "BRL") continue;
    if (!Number.isFinite(taxa) || taxa <= 0) continue;

    taxas[moeda] = taxa;
    variacoes[moeda] = {
      percentual: Number(valor.pctChange) || 0,
      maxima: Number(valor.high) || taxa,
      minima: Number(valor.low) || taxa,
      atualizadoEm: Number(valor.timestamp) * 1000 || null,
    };
    if (Number(valor.timestamp)) timestamps.push(Number(valor.timestamp) * 1000);
  }

  if (Object.keys(taxas).length < 2) {
    throw new Error("Nenhuma cotação válida foi encontrada na resposta.");
  }

  return {
    taxas,
    variacoes,
    atualizadoEm: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
  };
}

/** Quantas unidades da moeda de destino valem 1 unidade da moeda de origem. */
export function taxaEntre(origem, destino, taxas) {
  if (!taxas?.[origem] || !taxas?.[destino]) {
    throw new Error(`Cotação indisponível para ${origem}/${destino}.`);
  }
  return taxas[origem] / taxas[destino];
}

/** Converte um valor entre duas moedas. */
export function converter(valor, origem, destino, taxas) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return 0;
  return numero * taxaEntre(origem, destino, taxas);
}

/** Formata um valor na moeda informada, no padrão pt-BR. */
export function formatarMoeda(valor, moeda) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: moeda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}

/** Formata o valor de 1 unidade com precisão extra para moedas fracionadas. */
export function formatarTaxa(valor, moeda) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";

  const casas = numero < 0.1 ? 6 : numero < 1 ? 4 : 2;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: moeda,
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(numero);
}

/** Percentual de variação no dia, com sinal. */
export function formatarVariacao(percentual) {
  const numero = Number(percentual);
  if (!Number.isFinite(numero)) return "0,00%";

  const sinal = numero > 0 ? "+" : "";
  return `${sinal}${numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

/** Texto relativo em português para a idade de uma cotação. */
export function idadeRelativa(atualizadoEm, agora = Date.now()) {
  const instante = typeof atualizadoEm === "number" ? atualizadoEm : Date.parse(atualizadoEm);
  if (!Number.isFinite(instante)) return "horário desconhecido";

  const segundos = Math.max(0, Math.round((agora - instante) / 1000));
  if (segundos < 60) return "agora mesmo";

  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.round(horas / 24);
  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

/** O cache só é usado dentro da janela de validade. */
export function cacheValido(salvoEm, agora = Date.now(), ttl = TTL_CACHE_MS) {
  if (!Number.isFinite(salvoEm)) return false;
  const idade = agora - salvoEm;
  return idade >= 0 && idade < ttl;
}

/** Lista de moedas que possuem cotação na tabela informada. */
export function moedasDisponiveis(taxas) {
  return MOEDAS_ORDEM.filter((codigo) => Number.isFinite(taxas?.[codigo]));
}
