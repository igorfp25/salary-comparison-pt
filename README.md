# Comparador de Salário PT

Aplicação estática para comparar propostas de remuneração para trabalhador subordinado em Portugal.

## Como usar localmente

Abra `index.html` no navegador. Como o projeto usa apenas HTML, CSS e JavaScript nativo, não é necessário instalar dependências.

## Testes e validação

É necessário ter Node.js 24 ou superior instalado para executar a suíte. Use `npm test` para executar os testes automatizados e `npm run check` para verificar a sintaxe dos pontos de entrada. O workflow em `.github/workflows/validate.yml` executa os testes em cada push e pull request; um workflow de publicação pode depender deste resultado antes de fazer o deploy.

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

Pode guardar todas as propostas visíveis num ficheiro JSON local. A aplicação mostra um aviso de dados sensíveis antes da exportação e pode proteger o ficheiro com uma palavra-passe que não é guardada.

Também pode importar uma exportação JSON e escolher entre substituir a simulação atual (com confirmação) ou adicionar as propostas importadas. Os ficheiros protegidos pedem a palavra-passe usada na exportação.

## Nota fiscal

Os cálculos são uma simulação baseada nas premissas configuradas e na tabela de IRS versionada no projeto. Para uso público, valide as regras e tabelas oficiais vigentes antes de publicar.
