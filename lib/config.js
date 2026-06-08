const config = {
  // App
  appName: process.env.NEXT_PUBLIC_APP_NAME || "DocuCheck Africa",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development",

  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  // OpenAI
  openaiKey: process.env.OPENAI_API_KEY,

  // AWS
  awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || "us-east-1",
  awsS3Bucket: process.env.AWS_S3_BUCKET,

  // Resend
  resendKey: process.env.RESEND_API_KEY,
  resendFrom: process.env.RESEND_FROM_EMAIL,
};

// Check all required keys are present
const required = [
  "supabaseUrl",
  "supabaseKey",
  "openaiKey",
  "awsAccessKey",
  "awsSecretKey",
  "awsS3Bucket",
  "resendKey",
];

required.forEach((key) => {
  if (!config[key]) {
    console.warn(`Warning: Missing environment variable for ${key}`);
  }
});

module.exports = config;