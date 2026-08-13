import { generateAnswer } from "../services/llm.service";

async function main() {
  const answer = await generateAnswer(
    "In one sentence, what is Retrieval-Augmented Generation?"
  );

  console.log(answer);
}

main();