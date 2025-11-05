export const ENV = {
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
} as const;

// Validation
if (!ENV.OPENAI_API_KEY || ENV.OPENAI_API_KEY === 'user_will_add_their_key_here') {
  console.warn('⚠️ Missing VITE_OPENAI_API_KEY in .env file. AI rationale generation will not work.');
}
