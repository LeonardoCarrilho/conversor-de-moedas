# Redesign da interface

Refs #6; continuação do PR #4.

warm-black-gold / Instrument Sans + DM Mono; carvão e ouro para destacar os valores de câmbio. A apresentação usa a interface real e preserva os fluxos existentes. A folha editorial anterior permanece no histórico, mas deixou de ser carregada. A camada funcional continua em styles.css e a identidade nova em redesign.css.

A integração partiu de origin/chore/security-quality, preservando CSP, observabilidade, workflows, testes e dependências. Nenhuma regra de cálculo ou requisição foi substituída.

Validação inicial: 19 testes passaram na branch integrada; lint passou com aviso informativo pré-existente sobre recommended no Biome. Build passou. Overrides restritos de test-exclude usam glob 14.0.5 e minimatch 11.0.8. npm install confirmou zero vulnerabilidades; testes de cobertura passaram.

Capturas e relatórios completos permanecem em .taste-skill, sem perfis de navegador no Git. Revisão visual e gate: em andamento.

Testes de cobertura: 19 passaram; 100% linhas; 84,61% branches (rates.js). E2E: 9 passaram nas jornadas existentes, CSP e responsividade (320, 390, 768 e 1440px), antes dos últimos ajustes de foco e contraste.

A primeira rodada do gate apontou requisitos de landing page incompatíveis com esta ferramenta: seções fullscreen, fotografias/mockups, CTAs promocionais e alinhamentos que desconsideram painéis. Esses resultados permanecem registrados, sem isenções amplas. Os achados aplicáveis de foco, contraste e alvos de toque foram corrigidos; a segunda rodada está pendente.

Medições registradas até a primeira rodada: captura anterior desktop 1440×1841; captura posterior desktop 1440×1893; posterior mobile 390×3715. As alturas representam conteúdo total, não uma nota de qualidade. Não há captura anterior mobile nem gate anterior ao redesign; portanto não fazemos comparação de score ou contagens de falhas. Estados adicionais foram exercitados pelos testes, sem medição visual anterior. Cotações e previsão podem variar entre capturas por serem dados externos.
