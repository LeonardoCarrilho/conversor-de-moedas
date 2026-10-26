import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MOEDAS,
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
} from "../src/rates.js";

const respostaExemplo = {
  USDBRL: {
    code: "USD",
    codein: "BRL",
    bid: "4.9652",
    pctChange: "-1.723967",
    high: "5.0543",
    low: "4.9636",
    timestamp: "1793019429",
  },
  EURBRL: {
    code: "EUR",
    codein: "BRL",
    bid: "5.5973",
    pctChange: "0.304572",
    high: "5.6144",
    low: "5.5687",
    timestamp: "1793019444",
  },
  JPYBRL: {
    code: "JPY",
    codein: "BRL",
    bid: "0.03163679",
    pctChange: "0.050507",
    high: "0.03172645",
    low: "0.03149801",
    timestamp: "1793019430",
  },
};

describe("normalizarResposta", () => {
  it("converte a resposta da API em uma tabela base BRL", () => {
    const dados = normalizarResposta(respostaExemplo);

    assert.equal(dados.taxas.BRL, 1);
    assert.equal(dados.taxas.USD, 4.9652);
    assert.equal(dados.taxas.EUR, 5.5973);
    assert.equal(dados.taxas.JPY, 0.03163679);
    assert.equal(dados.variacoes.USD.percentual, -1.723967);
    assert.equal(dados.variacoes.USD.maxima, 5.0543);
    assert.equal(
      dados.atualizadoEm,
      new Date(1793019444 * 1000).toISOString()
    );
  });

  it("ignora pares fora do padrão X-BRL e valores inválidos", () => {
    const dados = normalizarResposta({
      ...respostaExemplo,
      EURUSD: { code: "EUR", codein: "USD", bid: "1.1" },
      GBPBRL: { code: "GBP", codein: "BRL", bid: "inválido" },
      ARSBRL: { code: "ARS", codein: "BRL", bid: "-3" },
      XPTOBRL: { code: "XPTO", codein: "BRL", bid: "9.9" },
    });

    assert.deepEqual(Object.keys(dados.taxas).sort(), ["BRL", "EUR", "JPY", "USD"]);
    assert.equal(dados.variacoes.GBP, undefined);
  });

  it("rejeita respostas sem nenhuma cotação utilizável", () => {
    assert.throws(() => normalizarResposta(null), TypeError);
    assert.throws(() => normalizarResposta([]), TypeError);
    assert.throws(() => normalizarResposta({}), /Nenhuma cotação/);
    assert.throws(
      () => normalizarResposta({ USDBRL: { code: "USD", codein: "BRL", bid: "0" } }),
      /Nenhuma cotação/
    );
  });
});

describe("taxaEntre e converter", () => {
  const taxas = TAXAS_REFERENCIA;

  it("retorna 1 para a mesma moeda", () => {
    assert.equal(taxaEntre("USD", "USD", taxas), 1);
    assert.equal(taxaEntre("BRL", "BRL", taxas), 1);
  });

  it("usa a taxa direta quando o destino é o real", () => {
    assert.equal(taxaEntre("USD", "BRL", taxas), 4.9652);
  });

  it("inverte a taxa quando a origem é o real", () => {
    assert.ok(Math.abs(taxaEntre("BRL", "USD", taxas) - 1 / 4.9652) < 1e-12);
  });

  it("calcula pares cruzados pela razão das taxas", () => {
    const esperado = 4.9652 / 5.5973;
    assert.ok(Math.abs(taxaEntre("USD", "EUR", taxas) - esperado) < 1e-12);
  });

  it("converte valores entre moedas", () => {
    assert.ok(Math.abs(converter(100, "USD", "BRL", taxas) - 496.52) < 1e-9);
    assert.equal(converter(0, "USD", "BRL", taxas), 0);
    assert.equal(converter("abc", "USD", "BRL", taxas), 0);
    assert.ok(Math.abs(converter(1000, "BRL", "EUR", taxas) - 178.657) < 0.001);
  });

  it("avisa quando falta cotação para o par", () => {
    assert.throws(() => taxaEntre("USD", "XYZ", taxas), /indisponível/);
    assert.throws(() => taxaEntre("XYZ", "BRL", taxas), /indisponível/);
  });
});

describe("formatadores", () => {
  it("formata moeda no padrão pt-BR", () => {
    assert.match(formatarMoeda(496.52, "BRL"), /496,52/);
    assert.match(formatarMoeda(1234.5, "USD"), /1\.234,50/);
    assert.equal(formatarMoeda("nada", "BRL"), "—");
  });

  it("aumenta a precisão de moedas com valores muito baixos", () => {
    assert.match(formatarTaxa(0.00325571, "BRL"), /0,003256/);
    assert.match(formatarTaxa(0.5, "BRL"), /0,5000/);
    assert.match(formatarTaxa(4.9652, "BRL"), /4,97/);
  });

  it("mostra variação com sinal", () => {
    assert.match(formatarVariacao(2.5), /\+2,50%/);
    assert.match(formatarVariacao(-1.723967), /-1,72%/);
    assert.match(formatarVariacao(0), /0,00%/);
  });
});

describe("idadeRelativa", () => {
  const agora = Date.parse("2026-10-26T12:00:00Z");

  it("descreve segundos, minutos, horas e dias", () => {
    assert.equal(idadeRelativa(agora - 30_000, agora), "agora mesmo");
    assert.equal(idadeRelativa(agora - 5 * 60_000, agora), "há 5 min");
    assert.equal(idadeRelativa(agora - 3 * 3_600_000, agora), "há 3 h");
    assert.equal(idadeRelativa(agora - 2 * 86_400_000, agora), "há 2 dias");
    assert.equal(idadeRelativa(agora - 86_400_000, agora), "há 1 dia");
  });

  it("aceita ISO e devolve texto seguro para datas inválidas", () => {
    assert.equal(idadeRelativa(new Date(agora).toISOString(), agora), "agora mesmo");
    assert.equal(idadeRelativa("data-ruim", agora), "horário desconhecido");
    assert.equal(idadeRelativa(REFERENCIA_EM, agora), "agora mesmo");
  });
});

describe("cacheValido", () => {
  const agora = 1_800_000_000_000;

  it("aceita cache dentro da janela de 15 minutos", () => {
    assert.equal(cacheValido(agora - 60_000, agora), true);
    assert.equal(cacheValido(agora - TTL_CACHE_MS + 1, agora), true);
  });

  it("rejeita cache expirado, futuro ou inválido", () => {
    assert.equal(cacheValido(agora - TTL_CACHE_MS, agora), false);
    assert.equal(cacheValido(agora + 5_000, agora), false);
    assert.equal(cacheValido(Number.NaN, agora), false);
  });
});

describe("moedasDisponiveis", () => {
  it("mantém a ordem e ignora moedas sem cotação", () => {
    const disponiveis = moedasDisponiveis({ BRL: 1, USD: 5, EUR: 6 });
    assert.deepEqual(disponiveis, ["BRL", "USD", "EUR"]);
    assert.deepEqual(moedasDisponiveis({}), []);
  });

  it("todas as moedas exibidas possuem metadados", () => {
    for (const codigo of moedasDisponiveis(TAXAS_REFERENCIA)) {
      assert.ok(MOEDAS[codigo], `faltam metadados para ${codigo}`);
    }
  });
});
