import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * OCR via OpenAI gpt-4o vision (replaces AWS Textract).
 * Handles images directly and PDFs as file input.
 * Keeps the same return shape the pipeline expects:
 *   { text, confidence, lineCount, isLowQuality }
 */
export async function extractText(fileBuffer, mimeType = "image/jpeg") {
  try {
    console.log(`Starting OCR with gpt-4o vision (${mimeType})...`);

    const base64 = fileBuffer.toString("base64");

    // Build the document content part based on file type.
    let documentPart;
    if (mimeType.startsWith("image/")) {
      documentPart = {
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${base64}` },
      };
    } else if (mimeType === "application/pdf") {
      documentPart = {
        type: "file",
        file: {
          filename: "document.pdf",
          file_data: `data:application/pdf;base64,${base64}`,
        },
      };
    } else {
      throw new Error(
        "Unsupported file type for OCR. Please upload an image (JPG, PNG) or a PDF."
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are an OCR engine. Transcribe every piece of visible text from the document exactly as it appears, preserving numbers, dates, reference codes, and names character for character. Do not summarise, translate, correct, reorder, or infer missing text. If part of the document is illegible, write [illegible] in its place. Return only the transcribed text, with no commentary.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe all text from this document." },
            documentPart,
          ],
        },
      ],
    });

    const text = (response.choices[0]?.message?.content || "").trim();
    const lineCount = text ? text.split(/\n+/).length : 0;

    // gpt-4o does not expose a per-line confidence like Textract did.
    // Use a light heuristic so downstream steps and the audit log keep working.
    const isLowQuality = text.length < 20;
    const confidence = isLowQuality ? 40 : 95;

    console.log(`OCR complete - ${text.length} chars, ${lineCount} lines`);
    if (isLowQuality) {
      console.warn("Low text yield - document may be unclear");
    }

    return { text, confidence, lineCount, isLowQuality };
  } catch (error) {
    console.error("OCR Service Error:", error.message);
    throw new Error(`OCR failed: ${error.message}`);
  }
}
