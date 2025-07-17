# Desafio-Tecnico-CSE---Laburen.com

## 1. Fase Conceptual · Diseño del Agente de IA

1. **Mapa de flujo**
   Desafio Tecnico CSE - Laburen.com

Usuario: "Quiero ver celulares baratos"
↓
Frontend llama: POST /message { message: "Quiero ver celulares baratos" }
↓
Backend reenvía a OpenAI → LLM detecta intención: "buscar productos"
↓
Backend llama a: GET /products?q=celular
↓
Muestra resultados al usuario

---

Usuario: "Agregá 2 iPhones 13 al carrito"
↓
POST /message { message: "Agregá 2 iPhones 13 al carrito" }
↓
LLM → intención: "crear carrito"
↓
Backend llama a: POST /carts
Body: { items: [{ product_id: 123, qty: 2 }] }

---

Usuario: "Mejor poné uno solo"
↓
POST /message { message: "Mejor poné uno solo" }
↓
LLM → intención: "editar carrito"
↓
Backend llama a: PATCH /carts/:id
Body: { items: [{ product_id: 123, qty: 1 }] }

2. **Arquitectura de alto nivel**
   ┌────────────────────────────┐
   │ Usuario final │
   └────────────┬───────────────┘
   │
   ▼
   ┌────────────────────────────┐
   │ Chat Web (React UI) │
   │ - Captura el input │
   │ - Muestra la respuesta │
   └────────────┬───────────────┘
   │
   POST /message
   │
   ▼
   ┌────────────────────────────┐
   │ NestJS Backend │
   │ Controller: /message │
   │ - Valida y enruta mensaje │
   │ - Llama a OpenAI API │
   └────────────┬───────────────┘
   │
   Detecta intención
   │
   ▼
   ┌────────────────────────────────────────────┐
   │ OpenAI API (function-calling / completions)│
   │ - Devuelve intención y argumentos │
   └────────────┬───────────────────────────────┘
   │
   ▼
   ┌────────────────────────────┐
   │ Lógica de ejecución NestJS │
   │ - Llama a API interna REST │
   └────────────┬───────────────┘
   ▼
   Endpoints internos: - GET /products?q=... - POST /carts - PATCH /carts/:id
   │
   ▼
   ┌────────────────────────────┐
   │ Prisma ORM │
   └────────────┬───────────────┘
   ▼
   ┌────────────────────────────┐
   │ PostgreSQL DB │
   │ - products, carts, items │
   └────────────────────────────┘
