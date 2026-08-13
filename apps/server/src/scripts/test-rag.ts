import { askQuestion } from "../services/rag.service";

async function main() {
  const workspaceId = "cmsciw83o0001lvr0nrajub2b";

  const result = await askQuestion(
    workspaceId,
    "What is my CGPA?"
  );

  console.log("\n========== ANSWER ==========\n");
  console.log(result.answer);

  console.log("\n========== SOURCES ==========\n");

  result.sources.forEach((source, index) => {
    console.log(`Source ${index + 1}`);
    console.log(`Similarity: ${source.similarity.toFixed(4)}`);
    console.log(source.content);
    console.log("\n-----------------------------\n");
  });
}

main().catch(console.error);