import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@notle.app" },
    update: {},
    create: {
      name: "Demo Student",
      email: "demo@notle.app",
      emailVerified: new Date(),
    },
  });

  await prisma.noteSet.upsert({
    where: { id: "demo-note-set" },
    update: {},
    create: {
      id: "demo-note-set",
      userId: user.id,
      title: "Intro to Cell Biology",
      rawContent:
        "Cells are the basic unit of life. The cell membrane regulates entry and exit. Mitochondria produce ATP via cellular respiration.",
      sourceType: "PASTE",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
