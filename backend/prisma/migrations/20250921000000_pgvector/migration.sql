CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "products" ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding"::vector;

CREATE INDEX IF NOT EXISTS "products_embedding_idx" ON "products" USING ivfflat ("embedding" vector_cosine_ops);
