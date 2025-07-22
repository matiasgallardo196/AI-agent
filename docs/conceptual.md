# Documentación Técnica del Agente de IA

## 1. Diseño Conceptual

### 1.1 Mapa de flujo del asistente (Microservicios)

**Escenario 1: Buscar productos**

```
Usuario: "Quiero ver pantalones"
   ⯆
POST /message (al servicio del agente IA)
   ⯆
OpenAI detecta intención: get_products
   ⯆
El agente hace una solicitud HTTP a:
GET https://desafio-tecnico-cse-laburen-com-1.onrender.com/products?q=pantalones
   ⯆
Devuelve lista de productos
```

**Escenario 2: Crear carrito**

```
Usuario: "Agregá 2 Pantalón Verde Talla XXL al carrito"
   ⯆
POST /message (al servicio del agente IA)
   ⯆
OpenAI detecta intención: create_cart
   ⯆
El agente hace una solicitud HTTP a:
POST https://desafio-tecnico-cse-laburen-com-1.onrender.com/carts
Body: { items: [{ product_id: 1, qty: 2 }] }
```

**Escenario 3: Modificar carrito**

```
Usuario: "Mejor poné uno solo"
   ⯆
POST /message (al servicio del agente IA)
   ⯆
OpenAI detecta intención: update_cart
   ⯆
El agente hace una solicitud HTTP a:
PATCH https://desafio-tecnico-cse-laburen-com-1.onrender.com/carts/:id
Body: { items: [{ product_id: 1, qty: 1 }] }
```

---

### 1.2 Arquitectura de alto nivel (Microservicios)

```
┌────────────────────────────┐
│      Usuario final         │
└────────────┬───────────────┘
             ▼
┌──────────────────────────────────────────────────────┐
│ Frontend Web (React - Vercel)                        │
│ - Captura el input del usuario                       │
│ - Envia mensaje a servicio agente vía POST /message  │
│ URL: https://desafio-tecnico-cse-laburen-com-2yk.vercel.app │
└────────────┬──────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Servicio de Agente IA (NestJS - Render)      │
│ - Detecta intención con OpenAI               │
│ - Llama a la API REST vía HTTP               │
│ URL: https://agente-laburen.onrender.com     │
└────────────┬─────────────────────────────────┘
             ▼
┌──────────────────────────────────────────────┐
│ API REST de productos y carritos (NestJS)    │
│ - CRUD de productos y carritos               │
│ URL: https://desafio-tecnico-cse-laburen-com-1.onrender.com │
└────────────┬─────────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│ PostgreSQL (Supabase + pgvector)       │
│ Prisma ORM                             │
└─────────────────────────────────────────┘
```

---

### 1.3 Viabilidad del diseño

- Separación clara de responsabilidades entre agente y API de negocio.
- Comunicación mediante solicitudes HTTP reales entre servicios.
- NestJS permite modularidad y escalabilidad.
- Prisma facilita el acceso a la base de datos.
- Supabase ofrece PostgreSQL administrado con soporte para `pgvector` (embeddings).
- Despliegue distribuido en Vercel y Render para facilitar pruebas públicas.

---

### 1.4 Métricas sugeridas

- **Tasa de conversión:** mensajes de intención de compra vs. carritos creados.
- **Tiempo medio de respuesta** del agente IA (desde mensaje hasta respuesta final).
- **Uso del agente:** cantidad de mensajes enviados y carritos modificados.
- **Errores funcionales:** productos inexistentes, stock insuficiente, fallos en update.
