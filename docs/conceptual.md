## Diseño Conceptual del Agente de IA

### Mapa de flujo del asistente

**Escenario 1: Buscar productos**

Usuario: "Quiero ver pantalones"
↓
POST /message { message: "Quiero ver pantalones" }
↓
OpenAI detecta intención: `get_products`
↓
Backend llama a: GET /products?q=pantalones
↓
Se devuelven los productos encontrados

---

**Escenario 2: Crear carrito**

Usuario: "Agregá 2 Pantalón Verde Talla XXL al carrito"
↓
POST /message { message: "Agregá 2 Pantalón Verde Talla XXL al carrito" }
↓
OpenAI detecta intención: `create_cart`
↓
Backend llama a: POST /carts
Body: { items: [{ product_id: 1, qty: 2 }] }

---

**Escenario 3: Modificar carrito**

Usuario: "Mejor poné uno solo"
↓
POST /message { message: "Mejor poné uno solo" }
↓
OpenAI detecta intención: `update_cart`
↓
PATCH /carts/:id
Body: { items: [{ product_id: 1, qty: 1 }] }

---

### Arquitectura de alto nivel

```
    ┌────────────────────────────┐
    │      Usuario final         │
    └────────────┬───────────────┘
                 ▼
    ┌────────────────────────────┐
    │ Chat Web (React)           │
    │ - Captura input            │
    │ - Muestra respuesta        │
    └────────────┬───────────────┘
                 │ POST /message
                 ▼
    ┌────────────────────────────┐
    │ NestJS Backend             │
    │ - Detecta intención        │
    │ - Ejecuta lógica por intent│
    └────────────┬───────────────┘
                 ▼
    ┌────────────────────────────┐
    │ OpenAI (embeddings + intent) │
    └────────────┬───────────────┘
                 ▼
    ┌────────────────────────────┐
    │ Prisma + PostgreSQL        │
    └────────────────────────────┘
```
