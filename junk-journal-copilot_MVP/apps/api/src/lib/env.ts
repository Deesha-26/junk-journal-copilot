import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  COOKIE_NAME: z.string().default("jj_token"),
  COOKIE_SECURE: z.string().default("false"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  STORAGE_DIR: z.string().default("./storage"),
  PUBLIC_BASE_URL: z.string().default("http://localhost:3001"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}
