# Technical Documentation – AI Agent

## 1. Conceptual Design

### 1.1 Assistant Flow Map

**Scenario 1: Search products**

User: “I want to see pants”  
   ⯆  
POST /message `{ message: "I want to see pants" }`  
   ⯆  
OpenAI detects intent: `get_products`  
   ⯆  
GET /products?q=pantalones  
   ⯆  
Returns product list

**Scenario 2: Create cart**

User: “Add 2 Green Pants Size XXL to the cart”  
   ⯆  
POST /message `{ message: "Add 2 Green Pants Size XXL to the cart" }`  
   ⯆  
OpenAI detects intent: `create_cart`  
   ⯆  
POST /carts  
Body: `{ items: [{ product_id: 1, qty: 2 }] }`

**Scenario 3: Update cart**

User: “Better just add one”  
   ⯆  
POST /message `{ message: "Better just add one" }`  
   ⯆  
OpenAI detects intent: `update_cart`  
   ⯆  
PATCH /carts/:id  
Body: `{ items: [{ product_id: 1, qty: 1 }] }`

### 1.2 High-Level Architecture

```
┌────────────────────────────┐
│       End User             │
└────────────┬───────────────┘
             ▼
┌──────────────────────────────────────────────┐
│ Chat Web (React) / WhatsApp (Twilio API)     │
│ - Captures user input                        │
│ - Sends messages to backend via HTTP         │
└────────────┬─────────────────────────────────┘
             │ POST /message
             ▼
┌────────────────────────────┐
│ NestJS Backend             │
│ - Detects intent           │
│ - Executes REST logic      │
└────────────┬───────────────┘
             ▼
┌────────────────────────────┐
│ OpenAI (Embeddings + Chat) │
└────────────┬───────────────┘
             ▼
┌──────────────────────────────────────────────┐
│ PostgreSQL (Supabase + pgvector) + Prisma    │
└──────────────────────────────────────────────┘
```

### 1.3 Design Feasibility

- Modular architecture (NestJS with separate services)  
- Standard HTTP usage, ideal for REST integrations  
- PostgreSQL enables scalability and complex queries  
- Supabase offers managed PostgreSQL with extensions like `pgvector`, essential for semantic search using embeddings  
- Prisma simplifies DB access and migrations  
- Clean interface: a single `/message` endpoint handles all requests  

### 1.4 Suggested Metrics

- **Conversion rate:** product queries vs. carts created  
- **Average agent response time** (from message to reply)  
- **Stock errors:** percentage of requests failing due to lack of stock  

## 2. Execution Instructions

### 2.1 Requirements

- Node.js 18+  
- PostgreSQL (Supabase with pgvector)  
- OpenAI API Key  

### 2.2 Environment Setup

```bash
# 1. Environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Edit environment files

# backend/.env
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
OPENAI_API_KEY=sk-...
PORT=3001

# frontend/.env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# 3. Install dependencies and prepare data
cd backend
npm install
npx prisma generate
npm run setup   # Creates DB, loads products, generates embeddings

# 4. Run backend and frontend (in separate terminals)
cd backend && npm run start:dev
cd frontend && npm install && npm run dev
```

### 2.3 Database Schema

The database is modeled using Prisma ORM and hosted on Supabase to leverage extensions like `pgvector`.

| Table       | Key Fields                                               |
|-------------|-----------------------------------------------------------|
| `products`  | id, name, description, price, stock, embedding (vector)   |
| `carts`     | id, created_at, updated_at                                |
| `cart_items`| id, cart_id (FK), product_id (FK), qty                    |

- Indexes on `name` and `description` for faster search.  
- The `embedding` field in the `Product` model enables semantic search using OpenAI-generated embeddings.  
- This field requires the `pgvector` extension, available on Supabase.  
- Relationships are defined via `@relation`, and columns use `@@map` to follow conventional snake_case SQL style.  

## 3. API Documentation

### `GET /products`  
**Description:** Lists products, supports optional search with `?q=`  
**Query Params:** `q` (optional string)  
**Response (200):**  
```json
[{ "id": 1, "name": "Green Pants", "price": 25.5, "stock": 12 }]
```
**Errors:** `404 Not Found`, `500 Internal Error`

### `GET /products/:id`  
**Description:** Returns a single product by ID  
**Path Param:** `id` (number)  
**Response (200):**  
```json
{ "id": 1, "name": "Green Pants", "price": 25.5, "stock": 12 }
```
**Errors:** `404 Not Found`  

### `POST /carts`  
**Description:** Creates a cart with products  
**Body:**  
```json
{ "items": [{ "product_id": 1, "qty": 2 }] }
```
**Response (201):** Cart created  
**Errors:** `400` (empty), `404` (product not found), `422` (out of stock)

### `PATCH /carts/:id`  
**Description:** Updates an existing cart  
**Path Param:** `id` (cart ID)  
**Body:** same as POST  
**Response (200):** Cart updated  
**Errors:** `400`, `404`, `422` (insufficient stock)

## 🧪 Online Demo

- **Frontend:** [https://desafio-tecnico-cse-laburen-com.vercel.app/](https://desafio-tecnico-cse-laburen-com.vercel.app/)  
- **Backend:** [https://desafio-tecnico-cse-laburen-com.onrender.com](https://desafio-tecnico-cse-laburen-com.onrender.com)  
- **WhatsApp (Twilio Sandbox):**  
  Send the message `join feed-individual` to **+1 415 523 8886** from your WhatsApp to join.  
  After that, you can interact with the agent as usual (e.g., “I want to see pants”).
