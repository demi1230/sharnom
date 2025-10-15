import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.yellowBookEntry.deleteMany();

  // Seed data - Mongolian companies with Ulaanbaatar coordinates
  const entries = [
    {
      name: 'Facebook',
      description: 'Meta Platforms, Inc. is an American multinational technology company.',
      address: 'Menlo Park, California, USA',
      phone: '+1-650-543-4800',
      website: 'https://www.facebook.com',
      email: 'contact@facebook.com',
      category: 'technology',
      latitude: 47.9184,
      longitude: 106.9177,
      rating: 4.5,
      employees: '70,000+',
      founded: 2004,
    },
    {
      name: 'Хаан Банк',
      description: 'Монгол улсын тэргүүлэгч арилжааны банк',
      address: 'Улаанбаатар хот, Сүхбаатар дүүрэг',
      phone: '+976-7011-1111',
      website: 'https://www.khanbank.com',
      email: 'info@khanbank.com',
      category: 'service',
      latitude: 47.9214,
      longitude: 106.9185,
      rating: 4.2,
      employees: '3,000+',
      founded: 1991,
    },
    {
      name: 'Монгол Шуудан',
      description: 'Монгол улсын үндэсний шуудангийн үйлчилгээ',
      address: 'Улаанбаатар хот, Чингэлтэй дүүрэг',
      phone: '+976-7011-1888',
      website: 'https://www.mongolpost.mn',
      email: 'info@mongolpost.mn',
      category: 'service',
      latitude: 47.9192,
      longitude: 106.9166,
      rating: 3.8,
      employees: '2,500+',
      founded: 1921,
    },
    {
      name: 'Номин Супермаркет',
      description: 'Монголын томоохон худалдааны сүлжээ',
      address: 'Улаанбаатар хот, Баянзүрх дүүрэг',
      phone: '+976-7000-0000',
      website: 'https://www.nomin.mn',
      email: 'info@nomin.mn',
      category: 'store',
      latitude: 47.9112,
      longitude: 106.9420,
      rating: 4.0,
      employees: '1,500+',
      founded: 1996,
    },
    {
      name: 'Модерн Номадс',
      description: 'Монголын шилдэг зочид буудал, амралт сувиллын үйлчилгээ',
      address: 'Улаанбаатар хот, Хан-Уул дүүрэг',
      phone: '+976-7011-0101',
      website: 'https://www.modernnomads.mn',
      email: 'info@modernnomads.mn',
      category: 'service',
      latitude: 47.8864,
      longitude: 106.9057,
      rating: 4.7,
      employees: '500+',
      founded: 2000,
    },
    {
      name: 'Монгол Эмнэлэг',
      description: 'Орчин үеийн эмнэлгийн тусламж үйлчилгээ',
      address: 'Улаанбаатар хот, Сүхбаатар дүүрэг',
      phone: '+976-7011-9119',
      website: 'https://www.hospital.mn',
      email: 'contact@hospital.mn',
      category: 'healthcare',
      latitude: 47.9183,
      longitude: 106.9140,
      rating: 4.3,
      employees: '800+',
      founded: 2005,
    },
    {
      name: 'Bull Рестораан',
      description: 'Монгол, олон улсын хоолны амттай газар',
      address: 'Улаанбаатар хот, Сүхбаатар дүүрэг',
      phone: '+976-7011-2345',
      website: 'https://www.bull.mn',
      email: 'info@bull.mn',
      category: 'restaurant',
      latitude: 47.9176,
      longitude: 106.9188,
      rating: 4.6,
      employees: '100+',
      founded: 2010,
    },
  ];

  for (const entry of entries) {
    await prisma.yellowBookEntry.create({
      data: entry,
    });
  }

  console.log('✅ Seed data created successfully!');
  console.log(`📝 Created ${entries.length} yellow book entries`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
