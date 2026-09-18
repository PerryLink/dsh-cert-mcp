# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/%40perrylink%2Fdsh-cert-mcp)](https://www.npmjs.com/package/@perrylink/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/%40perrylink%2Fdsh-cert-mcp)](https://www.npmjs.com/package/@perrylink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/card.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

Servidor [MCP](https://modelcontextprotocol.io) somente leitura que expõe o registro [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification): graus de certificação, datas de snapshot e evidências em cinco dimensões para plugins do DeepSeek Harness (DSH). Zero dependências de execução, transporte stdio.

## Ferramentas

| Ferramenta | Entrada | Retorna |
|---|---|---|
| `get_certification` | `owner`, `repo` | O registro completo de certificação (grau, snapshot, cinco dimensões, veto, notas) ou «sem registro» |
| `list_certified` | — | Todas as entradas do registro público: repositório / grau / snapshot |
| `certification_spec` | — | Resumo da especificação v1: cinco dimensões, escala de graus, regra de veto |

O snapshot embutido fica em `data/certified.json` (sincronizado do repositório de certificação) e o servidor o atualiza a partir do registro público no máximo uma vez a cada cinco minutos. Sem escritas, sem segredos, sem execução de código.

## Instalação

```sh
git clone https://github.com/PerryLink/dsh-cert-mcp
cd dsh-cert-mcp
node src/index.js        # servidor stdio
```

Você também pode executá-lo direto do pacote npm publicado: `npx @perrylink/dsh-cert-mcp`.

### Registrar em um cliente MCP

Claude Code:

```sh
claude mcp add dsh-cert -- node <path-to-repo>/src/index.js
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dsh-cert": {
      "command": "node",
      "args": ["<path-to-repo>/src/index.js"]
    }
  }
}
```

DSH: adicione-o pelo [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) como servidor stdio, ou use qualquer cliente MCP compatível com `stdio`.

### Instalar como bundle do DSH

O pacote declara `dsh.bundle.patch` → `cordis.patch.yml`, então também é instalável como bundle do DeepSeek Harness:

```sh
# canal git (main mais recente)
dsh plugin --profile web add "github:PerryLink/dsh-cert-mcp#main"

# canal npm (versões publicadas)
dsh plugin --profile web add @perrylink/dsh-cert-mcp
```

A linha inserida carrega o pacote pelo contrato padrão de plugins do Cordis: a metade host é um módulo ESM comum que exporta com nome `name`, `inject` e `apply(ctx)`. Este pacote não traz interface de navegador, portanto não há declaração `dsh.client`.

```js
// entrada do bundle (metade host) — o contrato que a linha do patch carrega
export const name = '@perrylink/dsh-cert-mcp'
export const inject = ['tools'] // a superfície de ferramentas do host, fornecida pelo dsh-tools
export function apply(ctx) {
  // registra a superfície de consulta de certificação somente leitura
  // (get_certification / list_certified / certification_spec)
}
```

**A metade host precisa do serviço `tools`** (fornecido por `@deepseek-ai/dsh-tools`). Um perfil sem ele não perde as ferramentas em silêncio: o Cordis mantém esta linha em `PENDING` até `tools` existir, e isso aparece na lista de plugins do perfil. Nada mais é exigido: nem chaves de configuração, nem credenciais, nem rede durante o carregamento.

**Duas metades, um único caminho de dados.** A linha do bundle e o servidor stdio são entradas separadas sobre o mesmo núcleo `handleRequest`. A metade servidor é um processo independente que qualquer cliente MCP pode iniciar (`node src/index.js`), e **não faz parte do caminho do plugin**: instalar este bundle nunca o inicia e removê-lo nunca o afeta. Na direção oposta, `npx @perrylink/dsh-cert-mcp` não registra nada na superfície de ferramentas do DSH.

Para remover: `dsh plugin --profile web remove @perrylink/dsh-cert-mcp` (ou apague a linha do patch do perfil). O servidor MCP stdio independente continua funcionando para qualquer cliente MCP.

## Por que isto existe

O repositório oficial do DeepSeek Harness não opera um registro de plugins e não aceita PRs externos; a descoberta acontece pelo topic `dsh-plugin` do GitHub e por listas da comunidade, e nenhuma delas certifica nada. O `dsh-plugin-certification` transforma «posso instalar este plugin?» em uma verificação reproduzível de cinco dimensões (manifesto, higiene de build, Scorecard de cadeia de suprimentos, procedência da publicação, teste de instalação em sandbox), com registro público e selos para o README. Este servidor MCP é o mesmo dado com uma interface para agentes: um agente pode consultar a certificação de um plugin antes de recomendá-lo ou instalá-lo.

## Registro

Fonte de dados: [PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) — `data/certified.json`, especificação v1.

## Compatibilidade

- Node `^22.19.0 || >=24.0.0`.
- DSH `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0` (declarado em `engines.dsh`, com `dsh.manifestVersion: 1`).
- Peer: `@deepseek-ai/cordis` `^4.0.2`. A metade host precisa ainda do serviço `tools` em tempo de execução; a metade stdio não precisa de nada além do Node.

## Desenvolvimento

```sh
pnpm install
pnpm run typecheck                            # a única régua de tipos: checkJs sobre a face host publicada
pnpm test                                     # smoke JSON-RPC + suíte de execução com Cordis real
pnpm pack                                     # o tarball publicado
```

A suíte de execução monta os registros REAIS `SystemPrompt`/`ToolRuntime` e verifica que montar este pacote coloca as três ferramentas de certificação em `ctx.tools.schemas()`, que liberar o fiber as remove e que um contexto sem o serviço `tools` deixa o plugin em `PENDING`. O `dsh --dump-config` é deliberadamente evitado como critério de aceitação: ali uma linha montada e um fiber pendente parecem iguais.

Há deliberadamente **uma única** régua de tipos. `@deepseek-ai/*` resolve pelo `node_modules` deste repositório (as devDependencies fixadas, ou seja, a linha publicada) e o pacote não declara nenhum peer de DSH, então uma segunda configuração de `tsc` seria o mesmo comando sobre o mesmo universo de tipos. O script `typecheck:ci` é mantido como a cópia histórica no-op (sua única chave extra é um `paths: {}` vazio) por compatibilidade com referências existentes, não como uma segunda face de tipos. A segunda evidência independente é o portão de montagem em execução acima.

## Família de plugins DSH da PerryLink

Este projeto é um dos [40 plugins do DeepSeek Harness](https://github.com/PerryLink) mantidos por [PerryLink](https://github.com/PerryLink). Se este ajudou você, provavelmente os outros também ajudarão:

| Plugin | Em uma linha |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Revisão automática por um segundo modelo na cadeia de aprovação, fechada por padrão |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Roteamento automático entre modelo forte e barato, com guardas de risco determinísticas e comando `/tier` |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Subagentes de fundo duráveis com barra lateral na interface web, mensagens e interrupção |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Governança de custos para o DeepSeek Harness: orçamentos, carbono e latência em um painel |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | Fonte de catálogo padrão do DSH Desktop Market para a família PerryLink |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Checkpoints unificados de sessão + espaço de trabalho + configuração com um único `/rewind` |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migra sessões, memórias e skills do Claude Code, Codex, OpenCode e Hermes para o DSH |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Controle nativo de desktop multiplataforma, com Windows primeiro |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Histórico de entrada estilo terminal para o compositor web: setas e busca Ctrl+R |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Perfilagem, limpeza e verificação de citações de datasets, determinística |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Defesa contra injeção de prompt, jailbreak e vazamento de segredos |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Guardião de disciplina de engenharia: interrogatório de requisitos, portões de teste, revisão adversária |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Roteamento unificado de geração de imagens estáticas |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Diagnóstico de desempenho somente leitura: carga, spill, compactação e acerto de cache |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Pesquisa de fundos mútuos chineses com snapshots de fontes selados e rastreáveis |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | Integração com PR/issue/CI do GitHub, com toda escrita sob aprovação |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Pacote de pesquisa setorial e de empresas: mapa da cadeia, linha do tempo de políticas, fichas |
| **[dsh-kit](https://github.com/PerryLink/dsh-kit)** | Pacote inicial que instala o núcleo da família com um comando |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Base de conhecimento local de documentos com busca híbrida e injeção com citações |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Descoberta de modelos Ollama locais e roteamento por tarefa com fallback na nuvem |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | Diagnósticos LSP, formatação, completude, ações de código, símbolos e renomeação |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | Mascaramento de PII no limite do modelo com tabela de restauração no host |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Console de gestão MCP: comando `/mcp`, aba de configurações e chamadas de teste |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Protocolo de memória entre sessões com aprovação (`ctx.memory` + SQLite) |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | Exportação de telemetria OpenTelemetry e Langfuse a partir do fluxo de eventos |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Estilos de saída do modelo trocáveis em tempo de execução |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Regras declarativas allow/deny/ask e política de rede em nível de processo |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Registro comunitário de certificação com graus e selos reproduzíveis |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Detector estático e de smoke em sandbox, sem dependências, para plugins DSH |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Base de conhecimento de desenvolvimento de plugins, skill de agente e CLI `dsh-plugin-dev` |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Caixa de ferramentas compartilhada sem dependências de execução para os plugins PerryLink |
| **[dsh-plugin-portal](https://github.com/PerryLink/dsh-plugin-portal)** | Portal estático sem dependências que renderiza toda a família em uma página |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | Cartão de corredor `0.1.3-alpha.1` → `0.1.5-rc.1` já mesclado e scanner de costuras |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Ponte multicanal de aprovações e perguntas: WeChat, Telegram, Feishu + console |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Relatórios de pesquisa verificáveis: livro de evidências, selo de manifesto, veredictos |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Pontuação de qualidade multidimensional com ranking sustentado por evidências |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Fixa sessões e espaços de trabalho na barra lateral web, com cor por fixação |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Sincronização de sessões entre dispositivos via git, preservando ambos os lados |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Pacote de skills de auditoria de segurança e portão de cadeia de suprimentos `plugin_vet` |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Laço de sessão por voz: entrada de fala para texto e respostas de texto para fala |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Salas de equipe entre sessões: barramento de mensagens, quadro de tarefas e linha do tempo |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Testes de instalação e smoke isolados com matriz de aprovado/reprovado |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | Ponte com TickTick/Dida365: painel no cabeçalho da sessão e onze ferramentas |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Tradução de parâmetros entre fornecedores e reparo determinístico de JSON |
| **[dsh-wechat](https://github.com/pan17/dsh-wechat)** | Ponte WeChat ↔ DSH (bot iLink da Tencent), desenvolvida com [pan17](https://github.com/pan17/dsh-wechat), que hospeda o repositório |
| **[dsh-personal-directive](https://github.com/PerryLink/dsh-personal-directive)** | Injetor de diretivas pessoais com alternador na barra superior (fork de liucai2026/dsh-personal-directive) |

## Licença

Apache-2.0. Uma listagem ou um grau é um registro de evidência, não uma garantia de segurança: plugins rodam dentro do seu processo DSH com as suas permissões.
