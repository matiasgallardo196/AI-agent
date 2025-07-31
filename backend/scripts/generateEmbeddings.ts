import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { OPENAI_API_KEY } from '../src/config/env.loader';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function main() {
  const products = await prisma.product.findMany();

  console.log(`📦 Total products found: ${products.length}`);

  for (const product of products) {
    try {
      console.log(`⏳ Generating embedding for: ${product.name}`);
      const input = `${product.name}. ${product.description}`;

      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
      });

      const embedding = embeddingRes.data[0].embedding;

      await prisma.$executeRawUnsafe(
        `UPDATE "products" SET embedding = $1 WHERE id = $2`,
        embedding,
        product.id,
      );

      console.log(`✅ Saved: ${product.name}`);
    } catch (error) {
      console.error(`❌ Error in ${product.name}:`, error.message || error);
    }
  }

  console.log('🏁 Embeddings regenerated for all products');
}

main();
