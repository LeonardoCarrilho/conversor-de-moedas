GATE: OPEN 55 (rounds used up)

# Revisão final da interface

Refs #6; continuação do PR #4. Sem merge ou publicação.

A composição preserva a ferramenta operacional, os campos e os resultados reais. O [plano](PLAN.md) registra a identidade, o deal e suas adaptações. A UI não recebeu fotografias, mockups, estatísticas ou depoimentos inventados. Não há fatos assumidos nem marca nova.

## Evidências

- Antes: [desktop](../docs/redesign-before.png), 1440×1841; baseline do main anterior à integração.
- Depois: [desktop](../docs/preview.png), 1440×1893; [mobile](../docs/preview-mobile.png), 390×3715.
- Capturas finais inspecionadas visualmente. Não há baseline mobile, gate anterior ao redesign ou medição comparável de performance; não inferimos melhoria numérica. Altura total é dimensão da captura, não nota de qualidade. Câmbio e clima usam dados externos, que podem variar entre capturas.
- 19 testes unitários/cobertura passaram na integração. CI com E2E em 320, 390, 768, 820, 1024 e 1440px passou no commit 846d510: [execução](https://github.com/LeonardoCarrilho/conversor-de-moedas/actions/runs/43126679839). Os checks incluem CSP e fluxo existente.
- npm audit: zero vulnerabilidades após overrides restritos de test-exclude; não houve mudança nas regras de negócio. Build e lint passaram. Os dois últimos ajustes são CSS de foco; o gate final exercitou Tab.

## Gate e limites

Todos os 59 FAILs abertos, 14 WARNs e suas localizações estão no [registro integral](findings.json). A validação não é PASS. As exigências de seções fullscreen, CTA promocional por seção, fotografia/mockup e momentos de demonstração são incompatíveis com a manutenção destas ferramentas. Elas continuam abertas, sem isenções genéricas. Alinhamentos sinalizados em painéis, subtítulos e tabelas foram confrontados com as capturas.

Achados finais de foco, contraste, toque, colisão, overflow de página e entrada: nenhum FAIL dessas classes no gate final.

Os WARNs de copy permanecem no registro: rótulos curtos de ações existentes e títulos informativos em português não foram convertidos em copy de venda. Não foram executados novos perfis de performance. Estados de erro, vazio, armazenamento e ações têm testes, mas não possuem captura anterior comparável.

## Isenções específicas

- **gaming-suspect**, dist/assets/index-: The bundled code is the unchanged taste-skill motion.js shot() check for HeadlessChrome; its own documented screenshot behavior, not application checker detection.
- **motion-layer**, html[data-motion]: Vite bundles the unchanged taste-skill motion.css into the generated CSS asset. Source index.html imports it and the built CSS contains the motion layer.
- **hero-fill**, main#conteudo > section.wrap:nth-of-type(2) "Sua conversão": The intro and the real converter are intentional adjacent columns at 1440px; screenshots show separate non-overlapping content. The application form is not a second promotional section.
- **nav**, header.site-header > div.wrap.header-inner > a.brand "Câmbio Hoje conversor de moedas": The two lines are the brand name and its category subtitle within one brand link, not wrapped navigation items. Both are visible inside the header.

A camada motion foi mantida sem editar o kit. Os momentos sorteados não foram aplicados a números financeiros ou meteorológicos. As três rodadas e os resultados exatos permanecem no registro; nenhuma contagem de gate foi usada como comparação com o baseline.
