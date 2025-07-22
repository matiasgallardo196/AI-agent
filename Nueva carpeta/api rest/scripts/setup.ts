import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function run(command: string) {
  console.log(`🚀 Ejecutando: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

async function main() {
  try {
    // 1. Crear extensión pgvector
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
    run('npx prisma db push');

    // 2. Forzar el tipo vector(1536) si es necesario
    const result = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'embedding'
      ) as exists;
    `);

    if (result[0]?.exists) {
      console.log('📐 Corrigiendo tipo embedding a vector(1536)...');
      await prisma.$executeRawUnsafe(
        `ALTER TABLE products ALTER COLUMN embedding TYPE vector(1536)`,
      );
    }

    // 3. Crear índice ivfflat si no existe
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'products_embedding_idx'
        ) THEN
          CREATE INDEX products_embedding_idx ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
          RAISE NOTICE 'Índice vectorial creado';
        ELSE
          RAISE NOTICE 'Índice vectorial ya existe';
        END IF;
      END
      $$;
    `);

    // 4. Correr seeding + embeddings
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
