import {
  TextractClient,
  DetectDocumentTextCommand,
} from "@aws-sdk/client-textract";

const textract = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function extractText(fileBuffer) {
  try {
    console.log("Starting OCR with AWS Textract...");

    const command = new DetectDocumentTextCommand({
      Document: { Bytes: fileBuffer },
    });

    const response = await textract.send(command);

    // Get all LINE blocks
    const lines = response.Blocks
      .filter((block) => block.BlockType === "LINE")
      .map((block) => block.Text);

    // Calculate average confidence
    const confidenceScores = response.Blocks
      .filter((block) => block.BlockType === "LINE")
      .map((block) => block.Confidence || 0);

    const avgConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

    console.log(`OCR complete - ${lines.length} lines extracted`);
    console.log(`Average confidence: ${avgConfidence.toFixed(1)}%`);

    // Warn if quality is low
    if (avgConfidence < 70) {
      console.warn("Low OCR confidence - document quality may be poor");
    }

    return {
      text: lines.join(" "),
      confidence: avgConfidence,
      lineCount: lines.length,
      isLowQuality: avgConfidence < 70,
    };

  } catch (error) {
    console.error("OCR Service Error:", error.message);
    throw new Error(`OCR failed: ${error.message}`);
  }
}