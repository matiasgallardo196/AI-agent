import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  const products = await prisma.product.findMany(); // sin filtro

  console.log(`📦 Total de productos encontrados: ${products.length}`);

  for (const product of products) {
    try {
      console.log(`⏳ Generando embedding para: ${product.name}`);
      const input = `${product.name}. ${product.description}`;

      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
      });

      const embedding = embeddingRes.data[0].embedding;

      await prisma.product.update({
        where: { id: product.id },
        data: { embedding },
      });

      console.log(`✅ Guardado: ${product.name}`);
    } catch (error) {
      console.error(`❌ Error en ${product.name}:`, error.message || error);
    }
  }

  console.log('🏁 Embeddings regenerados para todos los productos');
}

main();
