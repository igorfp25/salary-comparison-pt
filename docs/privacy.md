# Privacidade

Este projeto foi desenhado para poder ser publicado como repositório público e hospedado no GitHub Pages sem expor dados salariais digitados por utilizadores.

## O que a aplicação não faz

- Não tem backend.
- Não tem base de dados.
- Não exige autenticação.
- Não usa cookies.
- Não usa `localStorage`.
- Não usa `sessionStorage`.
- Não envia dados por `fetch`, `XMLHttpRequest` ou `sendBeacon`.
- Não inclui ferramentas de analytics.

## Onde os dados ficam

Os valores introduzidos no formulário ficam apenas em memória, no estado JavaScript da página aberta no navegador. Ao recarregar ou fechar o separador, esses valores desaparecem.

## O que fica público

Num repositório público, ficam públicos:

- o código fonte;
- as regras de cálculo implementadas;
- as tabelas fiscais versionadas;
- exemplos iniciais incluídos no código.

Não ficam públicos os valores que cada utilizador digitar na página, desde que a aplicação continue sem mecanismos de armazenamento ou envio de dados.

## Atenção ao GitHub Pages

O GitHub Pages hospeda os arquivos estáticos e pode registrar metadados técnicos de acesso, como endereço IP do visitante, por motivos operacionais e de segurança da própria plataforma. Isso é independente desta aplicação.

## Checklist antes de publicar

Antes de fazer deploy, verificar que o código continua sem:

- `localStorage`;
- `sessionStorage`;
- `document.cookie`;
- chamadas `fetch`;
- chamadas `XMLHttpRequest`;
- chamadas `navigator.sendBeacon`;
- scripts externos de analytics.
