import { llm, VISION_MODEL } from "./llmClient";

/**
 * OCR via Groq vision model (replaces AWS Textract / OpenAI).
 * Groq vision models accept images only (no PDF file input), so PDFs are
 * rejected with a clear message until we add rasterisation.
 * Returns the shape the pipeline expects: { text, confidence, lineCount, isLowQuality }
 */
export async function extractText(fileBuffer, mimeType = "image/jpeg") {
  try {
    console.log(`Starting OCR with Groq vision (${VISION_MODEL}, ${mimeType})...`);

    if (!mimeType.startsWith("image/")) {
      throw new Error(
        "Only image files (JPG, PNG) are supported for OCR right now. Please upload an image."
      );
    }

    const base64 = fileBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await llm.chat.completions.create({
      model: VISION_MODEL,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "You are an OCR engine. Transcribe every piece of visible text from this document exactly as it appears, preserving numbers, dates, reference codes, and names character for character. Do not summarise, translate, correct, reorder, or infer missing text. If part of the document is illegible, write [illegible] in its place. Return only the transcribed text, with no commentary.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const text = (response.choices[0]?.message?.content || "").trim();
    const lineCount = text ? text.split(/\n+/).length : 0;

    // Groq vision does not expose per-line confidence; use a light heuristic
    // so the audit log and "low quality" warning keep working.
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
