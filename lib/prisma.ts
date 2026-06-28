import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

// Strip surrounding quotes in case env vars were pasted with them from .env files
function cleanUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(/^["']|["']$/g, '');
}

const connectionString = cleanUrl(process.env.DATABASE_URL_UNPOOLED) ?? cleanUrl(process.env.DATABASE_URL);

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter, log: ["error"] });
