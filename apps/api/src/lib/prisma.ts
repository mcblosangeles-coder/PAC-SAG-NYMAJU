import { PrismaClient } from "@prisma/client";
import { env } from "./env";

const prismaClientSingleton = () =>
  new PrismaClient({
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"]
  });

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientSingleton;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
