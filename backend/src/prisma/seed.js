const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  // إنشاء SUPERADMIN
  const hashed = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@yourdomain.com" },
    update: {},
    create: {
      email: "admin@yourdomain.com",
      password: hashed,
      name: "Super Admin",
      role: "SUPERADMIN"
    }
  });
  console.log("✅ Admin created:", admin.email);

  // إنشاء 10 بريدات تجريبية
  const testInboxes = Array.from({ length: 10 }, (_, i) => ({
    address: `inbox${String(i + 1).padStart(3, "0")}@yourdomain.com`,
    label: `Inbox ${i + 1}`
  }));

  await prisma.inbox.createMany({ data: testInboxes, skipDuplicates: true });
  console.log("✅ Test inboxes created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
