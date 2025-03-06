import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://parrot_owner:npg_0GewZSWstr4f@ep-winter-firefly-a5u1jd9t-pooler.us-east-2.aws.neon.tech/parrot?sslmode=require',
  },
});