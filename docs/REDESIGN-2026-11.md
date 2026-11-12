# Redesign da interface

Refs #6; continuação do PR #4.

warm-black-gold / Instrument Sans + DM Mono; carvão e ouro para destacar os valores de câmbio. A apresentação usa a interface real e preserva os fluxos existentes. A folha editorial anterior permanece no histórico, mas deixou de ser carregada. A camada funcional continua em styles.css e a identidade nova em redesign.css.

A integração partiu de origin/chore/security-quality, preservando CSP, observabilidade, workflows, testes e dependências. Nenhuma regra de cálculo ou requisição foi substituída.

Validação inicial: 19 testes passaram na branch integrada; lint passou com aviso informativo pré-existente sobre recommended no Biome. Build passou. Overrides restritos de test-exclude usam glob 14.0.5 e minimatch 11.0.8. npm install confirmou zero vulnerabilidades; testes de cobertura passaram.

Relatório final: GATE: OPEN 55 (rounds used up). Os achados abertos foram preservados; não é uma aprovação visual automática.

[Relatório e limitações](../.taste-skill/REPORT.md) · [Registro integral](../.taste-skill/findings.json) · [Antes desktop](redesign-before.png) · [Depois desktop](preview.png) · [Depois mobile](preview-mobile.png).
