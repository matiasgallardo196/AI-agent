# Documentación Técnica del Agente de IA

## 1. Diseño Conceptual

### 1.1 Mapa de flujo del asistente

**Escenario 1: Buscar productos**

```
Usuario: "Quiero ver pantalones"
   ⯆
POST /message { message: "Quiero ver pantalones" }
   ⯆
OpenAI detecta intención: get_products
   ⯆
GET /products?q=pantalones
   ⯆
Devuelve lista de productos
```

**Escenario 2: Crear carrito**

```
Usuario: "Agregá 2 Pantalón Verde Talla XXL al carrito"
   ⯆
POST /message { message: "Agregá 2 Pantalón Verde Talla XXL al carrito" }
   ⯆
OpenAI detecta intención: create_cart
   ⯆
POST /carts
Body: { items: [{ product_id: 1, qty: 2 }] }
```

**Escenario 3: Modificar carrito**

```
Usuario: "Mejor poné uno solo"
   ⯆
POST /message { message: "Mejor poné uno solo" }
   ⯆
OpenAI detecta intención: update_cart
   ⯆
PATCH /carts/:id
Body: { items: [{ product_id: 1, qty: 1 }] }
```

### 1.2 Arquitectura de alto nivel

```
┌────────────────────────────┐
│      Usuario final         │
└────────────┬───────────────┘
             ▼
┌──────────────────────────────────────────────┐
│ Chat Web (React) / WhatsApp (Twilio API)     │
│ - Captura el input del usuario               │
│ - Envía mensajes al backend vía HTTP         │
└────────────┬─────────────────────────────────┘
             │ POST /message
             ▼
┌────────────────────────────┐
│ NestJS Backend             │
│ - Detecta intención        │
│ - Ejecuta lógica REST      │
└────────────┬───────────────┘
             ▼
┌────────────────────────────┐
│ OpenAI (Embeddings + Chat) │
└────────────┬───────────────┘
             ▼
┌─────────────────────────────────────────┐
│PostgreSQL (Supabase + pgvector)+ Prisma │
└─────────────────────────────────────────┘
```

### 1.3 Viabilidad del diseño

- Arquitectura modular (NestJS con servicios separados)
- Uso de HTTP estándar, ideal para integraciones REST
- PostgreSQL permite escalabilidad y queries complejas
- Supabase facilita el uso de PostgreSQL administrado con extensiones como `pgvector`, fundamentales para búsquedas semánticas con embeddings
- Prisma simplifica el acceso a la base y las migraciones
- Interfaz limpia: un solo endpoint `/message` maneja todo

### 1.4 Métricas sugeridas

- **Tasa de conversión:** consultas de productos / carritos creados
- **Tiempo medio de respuesta** del agente IA (de mensaje a respuesta)
- **Errores de stock:** porcentaje de solicitudes con falta de stock

---

## 2. Instrucciones de Ejecución

### 2.1 Requisitos

- Node.js 18+
- PostgreSQL (Supabase + pgvector)
- API Key de OpenAI

### 2.2 Setup del entorno

```bash
# 1. Variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Configurar .env
# backend/.env
DATABASE_URL=postgresql://postgres:[TU_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
OPENAI_API_KEY=sk-...
PORT=3001

# frontend/.env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# 3. Instalar dependencias y preparar datos
cd backend
npm install
npx prisma generate
npm run setup   # Crea base, carga productos, genera embeddings

# 4. Ejecutar frontend y backend (en terminales separadas)
cd backend && npm run start:dev
cd frontend && npm install && npm run dev
```

---

### 2.3 Esquema de Base de Datos

La base de datos fue modelada con Prisma ORM y alojada en Supabase para aprovechar extensiones como `pgvector`.

| Tabla        | Campos clave                                                                   |
| ------------ | ------------------------------------------------------------------------------ |
| `products`   | `id`, `name`, `description`, `price`, `stock`, `embedding` _(vector opcional)_ |
| `carts`      | `id`, `created_at`, `updated_at`                                               |
| `cart_items` | `id`, `cart_id` (FK), `product_id` (FK), `qty`                                 |

> Índices agregados a `name` y `description` para búsquedas más eficientes.  
> Se incluyó el campo `embedding` (vector) en el modelo `Product` para habilitar búsquedas semánticas mediante embeddings generados por OpenAI. Este campo requiere la extensión `pgvector`, disponible en Supabase.
> Las relaciones están definidas con `@relation` y las columnas se mapean a `snake_case` mediante `@@map` para alinearse al estilo SQL convencional.

## 3. Documentación de la API

### GET /products

- **Descripción:** Lista productos, permite buscar con `?q=`.
- **Parámetros query:** `q` (opcional, string)
- **Respuesta (200):**

```json
[{ "id": 1, "name": "Pantalón Verde", "price": 25.5, "stock": 12 }]
```

- **Errores:** 404 Not Found ,500 error interno

---

### GET /products/:id

- **Descripción:** Devuelve un producto por ID
- **Parámetros path:** `id` (número)
- **Respuesta (200):**

```json
{ "id": 1, "name": "Pantalón Verde", "price": 25.5, "stock": 12 }
```

- **Errores:** 404 si no existe, 500 error interno

---

### POST /carts

- **Descripción:** Crea carrito con productos
- **Body:**

```json
{ "items": [{ "product_id": 1, "qty": 2 }] }
```

- **Respuesta (201):** carrito creado
- **Errores:** 400 (vacío), 404 (producto no existe), 422 (sin stock)

---

### PATCH /carts/\:id

- **Descripción:** Modifica un carrito existente
- **Parámetros path:** `id` del carrito
- **Body:** igual al POST
- **Respuesta (200):** carrito actualizado
- **Errores:** 400, 404, 422 (stock insuficiente)

---

> Demo online:
>
> - Frontend: [https://desafio-tecnico-cse-laburen-com.vercel.app/](https://desafio-tecnico-cse-laburen-com.vercel.app/)
> - Backend: [https://desafio-tecnico-cse-laburen-com.onrender.com](https://desafio-tecnico-cse-laburen-com.onrender.com)
