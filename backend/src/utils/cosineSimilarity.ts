export function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai ** 2, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi ** 2, 0));
  return dot / (normA * normB);
}
