export function chunkText(text: string, chunkSize = 1000) {
  const chunks: string[] = [];

  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));

    start += chunkSize;
  }

  return chunks;
}