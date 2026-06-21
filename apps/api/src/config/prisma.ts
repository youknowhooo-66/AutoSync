import { prismaClient } from "../shared/database/prismaClient";

export const prisma = prismaClient;
export { PrismaClient } from "@prisma/client";
