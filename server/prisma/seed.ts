import { prisma } from "../src/utils/prisma";
async function main() {
 // No demo accounts or destructive resets. Safe to repeat.
 const groups = ["Грудь", "Спина", "Ноги", "Плечи", "Руки", "Корпус"];
 await prisma.$transaction(async tx => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(734621)`;
  for (const name of groups) {
   if (!await tx.category.findFirst({where:{name,userId:null,isCustom:false}}))
    await tx.category.create({data:{name,isCustom:false}});
  }
 });
 console.log("Default muscle groups are ready.");
}
main().catch(() => { console.error("Seed failed"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
