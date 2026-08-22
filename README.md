# Comparador de Salário PT

Aplicação estática para comparar propostas de remuneração para trabalhador subordinado em Portugal.

## Como usar localmente

Abra `index.html` no navegador. Como o projeto usa apenas HTML, CSS e JavaScript nativo, não é necessário instalar dependências.

## Publicação gratuita

Este repositório foi pensado para GitHub Pages:

1. Faça push para o GitHub.
2. Em `Settings > Pages`, selecione `Deploy from a branch`.
3. Escolha a branch `main` e a pasta `/root`.

## Estrutura

- `index.html`: tela principal.
- `styles.css`: estilos responsivos.
- `src/app.js`: estado, eventos e renderização.
- `src/domain/proposal.js`: modelos reutilizáveis de propostas, rendimentos e descontos.
- `src/ui/input-card.js`: apresentação modular do cartão de inputs.
- `src/i18n/pt.js`: textos do cartão em português, preparados para futuras traduções.
- `src/calculator.js`: regras de cálculo reutilizáveis.
- `src/data/irs-pt-brackets.js`: tabela de IRS usada na simulação.
- `docs/architecture.md`: arquitetura proposta e evolução do produto.
- `docs/privacy.md`: política técnica de privacidade e não persistência.

## Privacidade

A aplicação não usa backend, contas, cookies, analytics, `localStorage` ou `sessionStorage`.
Os valores digitados ficam apenas no estado temporário da página, em memória, e desaparecem ao recarregar ou fechar o separador.

## Nota fiscal

Os cálculos são uma simulação baseada nas premissas configuradas e na tabela de IRS versionada no projeto. Para uso público, valide as regras e tabelas oficiais vigentes antes de publicar.
