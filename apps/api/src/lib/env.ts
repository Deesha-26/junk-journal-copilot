import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.string().default("3001"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  COOKIE_NAME: z.string().default("jj_token"),
  STORAGE_DIR: z.string().default("./storage"),
});

export type Env = z.infer<typeof EnvSchema>;

export function env(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Invalid env: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  return parsed.data;
}
