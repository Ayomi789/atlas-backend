// import pdfParse from "pdf-parse";

// export async function extractPdfText(buffer: Buffer) {
//   const pdf = await pdfParse(buffer);

//   return pdf.text;
// }

import pdfParse from "pdf-parse";

export async function extractPdfText(buffer: Buffer) {
  try {
    const pdf = await pdfParse(buffer);

    console.log("Pages:", pdf.numpages);

    return pdf.text;
  } catch (error) {
    console.error("PDF Parse Error:", error);
    throw error;
  }
}