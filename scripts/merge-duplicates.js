// scripts/check-duplicates.js
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

async function main() {
  const contacts = await db.contact.findMany({
    select: { id: true, name: true, phone: true, workspaceId: true }
  });

  console.log(`Total contacts: ${contacts.length}`);

  const groups = {};
  for (const c of contacts) {
    const key = normalizePhone(c.phone);
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }

  const duplicates = Object.values(groups).filter(g => g.length > 1);
  console.log(`Duplicate groups: ${duplicates.length}`);
  
  for (const group of duplicates) {
    console.log(`\nPhone: ${group[0].phone} (normalized: ${normalizePhone(group[0].phone)})`);
    for (const c of group) {
      console.log(`  id: ${c.id} | name: ${c.name} | phone: ${c.phone} | workspace: ${c.workspaceId}`);
    }
  }
}

main().catch(console.error).finally(() => db.$disconnect());