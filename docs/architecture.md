# Arquitetura

## Objetivo

Criar um comparador de remuneração para Portugal que replique o fluxo principal do Excel:

- introdução de uma ou mais propostas;
- cálculo de salário bruto anual;
- cálculo de IRS, Segurança Social e benefícios;
- comparação de líquido mensal, líquido anual e pacote total.

## Decisão inicial

Para GitHub Pages gratuito, a primeira versão usa uma aplicação 100% estática:

- sem backend;
- sem base de dados;
- sem cookies, analytics ou armazenamento local;
- sem etapa obrigatória de build;
- dados fiscais versionados em arquivos JavaScript/JSON;
- cálculos executados no navegador.

Essa abordagem é suficiente para uma calculadora privada ou pública simples. Se no futuro houver contas de utilizador, histórico ou integração com fontes oficiais, o projeto pode evoluir para uma arquitetura com API.

## Privacidade por desenho

As propostas digitadas pelo utilizador são mantidas apenas em memória no navegador. A aplicação não usa `localStorage`, `sessionStorage`, cookies, analytics ou chamadas de rede para transmitir os valores calculados.

Qualquer funcionalidade futura de partilha, exportação em nuvem, analytics ou persistência deve ser tratada como mudança de arquitetura e documentada antes de ser implementada.

## Camadas

### Interface

`index.html`, `styles.css` e `src/app.js`.

Responsabilidades:

- capturar inputs;
- permitir comparar múltiplas propostas;
- mostrar cartões de resumo e tabela detalhada;
- exportar ou partilhar cenários em iterações futuras.

### Domínio

`src/calculator.js`.

Responsabilidades:

- calcular remuneração anual;
- calcular base tributável mensal;
- selecionar faixa de IRS;
- aplicar limite RNH quando configurado;
- calcular Segurança Social;
- calcular subsídios, bónus e benefícios;
- devolver resultado estruturado e testável.

### Dados

`src/data/irs-pt-brackets.js`.

Responsabilidades:

- isolar tabelas fiscais;
- permitir atualização anual sem tocar na interface;
- preservar metadados de origem/ano.



## Evolução recomendada

1. Validar os cálculos contra 3 a 5 cenários do Excel.
2. Atualizar tabelas de IRS para o ano vigente com fonte oficial.
3. Adicionar testes automatizados para o motor de cálculo.
4. Adicionar exportação CSV/PDF.
5. Adicionar modo "comparar proposta atual vs nova proposta".
