import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function run(command: string) {
  console.log(`🚀 Ejecutando: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

async function main() {
  try {
    run('npx prisma db push --force-reset');

    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "products_embedding_idx" ON "products" USING ivfflat ("embedding" vector_cosine_ops)`;

    run('ts-node scripts/seedExcelSample.ts');
    run('ts-node scripts/generateEmbeddings.ts');

    console.log('✅ Setup completo.');
  } catch (error) {
    console.error('❌ Error durante el setup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
