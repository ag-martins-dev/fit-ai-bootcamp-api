# Padrões e Regras do Projeto Bootcamp Fit.AI

Este diretório contém a documentação consolidada de padrões arquiteturais, de código e de operação do projeto. Use estes documentos como referência ao desenvolver novas features.

## 📋 Documentos de Padrões

### [architecture.md](architecture.md)

**Arquitetura, Estrutura e Design de API**

- Estrutura de pastas e organização
- Padrões de camadas (HTTP, Business Logic, Database, Validation, Error, Auth)
- Fluxo de dados (Request-Response)
- Tech Stack principal
- Princípios arquiteturais
- Padrões de Banco de Dados (Nomenclatura, Modelos, Queries, Include/Select, Transações)
- Padrões de API REST (URLs, Status Codes, Responses, Error Handling)
- Conventional Commits

**Quando consultar:** Ao criar novos módulos, entender a arquitetura, trabalhar com banco de dados ou API.

---

### [typescript.md](typescript.md)

**Padrões TypeScript e Tipagem**

- Regras de tipagem (nunca use `any`)
- DTOs (InputDto, OutputDto)
- Classes de Use Case
- Classes de Erro
- Tipos gerados pelo Prisma
- Type Guards
- Types complexos (unions, arrays, readonly)
- null vs undefined
- Tipagem com Zod
- Strict Mode
- Checklist de tipagem

**Quando consultar:** Ao escrever código TypeScript novo ou revisar tipos.

---

### [general.md](general.md)

**Padrões Gerais de Código e Operação**

- Nomenclatura (arquivos, pastas, variáveis, funções, tipos)
- Formatação (imports, espaçamento, quebra de linhas)
- Comentários (quando, estilo, idioma)
- Estrutura de Use Case
- Estrutura de Rota
- Tratamento de Erros (onde lançar, onde capturar, try-catch)
- Autenticação e Autorização
- Performance (N+1, filtros, select)
- Boas Práticas ✓ vs Antipadrões ✗
- Pre-commit Checklist

**Quando consultar:** Ao escrever novo código, revisar, ou antes de fazer commit.

---

## 🚀 Quick Start Para Novo Desenvolvedor

1. **Começar por aqui:** [architecture.md](architecture.md) - Entenda a estrutura geral
2. **Depois leia:** [typescript.md](typescript.md) - Regras de tipagem do projeto
3. **E por fim:** [general.md](general.md) - Padrões de código dia a dia
4. **Finalize com:** Pre-commit Checklist no final de [general.md](general.md)

---

## 📐 Estrutura Típica de um Use Case

Ver exemplo detalhado em [general.md](general.md#estrutura-de-use-case)

```typescript
// 1. Imports (seguindo general.md)
import { Something } from "../path";
import { ErrorType } from "../errors/index.js";
import { prisma } from "../lib/db.js";

// 2. DTOs (seguindo typescript.md)
interface InputDto {
  userId: string;
  // ...
}

export interface OutputDto {
  // ...
}

// 3. Classe (seguindo architecture.md)
export class UseCase {
  async execute(dto: InputDto): Promise<OutputDto> {
    // Validação de regra de negócio (architecture.md camada business logic)
    // Consultas/mutações do banco (architecture.md database layer)
    // Lançar erros customizados (general.md tratamento de erros)
    // Retornar dados tipados (typescript.md tipagem)
  }
}
```

---

## 📐 Estrutura Típica de uma Rota

Ver exemplo detalhado em [general.md](general.md#estrutura-de-rota)

```typescript
// 1. Imports e setup
app.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/path",

  // 2. Schema (architecture.md padrões API REST)
  schema: {
    tags: ["Recurso"],
    summary: "Descrição",
    body: ZodSchema,
    response: { /* ... */ },
  },

  // 3. Handler (architecture.md camada HTTP + general.md estrutura)
  handler: async (req, reply) => {
    try {
      // Autenticação (general.md autenticação e autorização)
      const session = await auth.api.getSession({...});

      // Extração de dados
      const { /* ... */ } = req.body;

      // Execução do use case
      const result = await new UseCase().execute({...});

      // Retorno
      return reply.status(201).send(result);
    } catch (err) {
      // Tratamento de erros (general.md tratamento de erros)
      if (err instanceof CustomError) {
        return reply.status(400).send({...});
      }
      // ...
    }
  },
});
```

---

## 🔍 Verificação Antes de PRs

Use este checklist (pre-commit checklist em [general.md](general.md)):

- [ ] Leu [architecture.md](architecture.md) para entender estrutura e placement?
- [ ] Seguiu [general.md](general.md) para nomenclatura e formatação?
- [ ] Seguiu [typescript.md](typescript.md) para tipagem?
- [ ] Cria erros customizados (veja general.md e typescript.md)?
- [ ] Interage com Prisma conforme [architecture.md](architecture.md) database patterns?
- [ ] Conferiu pre-commit checklist no final de [general.md](general.md)?

---

## 🤝 Contribuindo

Ao adicionar novos padrões não cobertos aqui:

1. Documente em um dos arquivos existentes se se encaixar
2. Se é uma nova categoria, crie um novo arquivo `{TOPICO}.md`
3. Atualize este `README.md` com a nova seção
4. Use mesmo estilo e formato dos outros documentos

---

## 📞 Dúvidas?

Se algo não está claro nos documentos ou encontra padrão não documentado:

1. Procure nos documentos existentes (use Ctrl+F)
2. Se não encontrar, peça esclarecimento
3. Documente a resposta para futuros desenvolvedores

---

**Última atualização:** 5 de março de 2026
**Versão do projeto:** 1.0.0
