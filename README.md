# 🤖 AI-agent — Conversational Shopping Assistant

This project was developed as part of the **Technical Challenge by CSE - Laburen.com**.  
It's a full-stack system that allows users to interact with a virtual store using natural language (via web or WhatsApp), powered by OpenAI and a modular backend architecture.

## 🚀 Features

- Semantic product search with OpenAI embeddings.
- Create and update shopping carts via conversational messages.
- Web interface + WhatsApp integration (Twilio).
- Clean microservice-based architecture (NestJS + Next.js).

## 🧱 Tech Stack

- Frontend: Next.js
- Backend: NestJS
- Database: PostgreSQL (Supabase + pgvector)
- AI & Embeddings: OpenAI
- ORM: Prisma
- Hosting: Vercel + Render

## 🔧 Quick Start

```bash
git clone https://github.com/matiasgallardo196/AI-agent.git
cd AI-agent
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Configure your environment variables
cd backend && npm install && npm run setup
cd frontend && npm install
```

- Start Backend: `cd backend && npm run start:dev`
- Start Frontend: `cd frontend && npm run dev`

## 📲 Online Demo

- Web: [desafio-tecnico-cse-laburen-com.vercel.app](https://desafio-tecnico-cse-laburen-com.vercel.app)
- API: [desafio-tecnico-cse-laburen-com.onrender.com](https://desafio-tecnico-cse-laburen-com.onrender.com)
- WhatsApp (Twilio Sandbox): Send `join feed-individual` to **+1 415 523 8886** from your WhatsApp to join. Then you can interact with the agent (e.g., "I want to see pants").

## 📄 Full Documentation

Check the complete technical documentation in the [`/docs`](./docs/conceptual.md) folder.

---

> Built by [Matías Gallardo](https://github.com/matiasgallardo196) for the CSE technical challenge.
