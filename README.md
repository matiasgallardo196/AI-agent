# Desafio-Tecnico-CSE---Laburen.com

## 1. Fase Conceptual · Diseño del Agente de IA

### 🧠 Mapa de flujo del asistente

**Escenario 1: Buscar productos**

Usuario: "Quiero ver celulares baratos"  
↓  
POST /message { message: "Quiero ver pantalones baratos" }  
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

### 🧱 Arquitectura de alto nivel

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

---

## 2. Puesta en marcha del entorno

### 🛠 Requisitos

- Node.js v18+
- PostgreSQL local
- API key de OpenAI

---

### 🚀 Setup completo (backend)

1. Cloná el proyecto y creá los `.env`:

```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Completá las variables necesarias en ambos `.env`, por ejemplo:

```
# backend/.env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/postgres
OPENAI_API_KEY=sk-...

# frontend/.env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

3. Instalá dependencias:

```
cd backend
npm install
```

4. Ejecutá el entorno completo con datos y embeddings ya generados:

```
npm run setup
```

Este comando:

- Crea la estructura de base de datos (`db push`)
- Carga un 10 % de `products.xlsx`
- Genera embeddings con OpenAI

---

### ▶️ Levantar frontend y backend

En dos terminales distintas:

```
# Backend
cd backend
npm run start:dev
```

```
# Frontend
cd frontend
npm install
npm run dev
```

El frontend se conecta al backend utilizando la variable `NEXT_PUBLIC_API_BASE_URL`.

---

Con eso, ya podés comenzar a interactuar con el agente vía el chat web.
