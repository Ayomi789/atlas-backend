import { generateEmbedding } from "../services/embedding.service";
import { searchSimilarChunks } from "../services/search.service";

async function main() {
  const embedding = await generateEmbedding(
    "What is the student's CGPA?"
  );

  const results = await searchSimilarChunks(embedding);

  console.log(results);
}

main();