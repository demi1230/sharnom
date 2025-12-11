import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

type Business = {
  name: string;
  category: string;
  description: string | null;
  address: string;
};

function createBusinessText(business: Business): string {
  // Combine relevant fields into a single text for embedding
  const parts = [
    business.name,
    business.category,
    business.description || '',
    business.address,
  ].filter(Boolean);
  
  return parts.join(' | ');
}

async function embedAllBusinesses() {
  console.log('🚀 Starting business embedding process...\n');

  // Get all businesses without embeddings
  const businesses = await prisma.yellowBookEntry.findMany({
    where: {
      OR: [
        { embedding: null },
        { embedding: '' },
      ],
    },
  });

  console.log(`📊 Found ${businesses.length} businesses to embed\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const business of businesses) {
    try {
      console.log(`Processing: ${business.name}...`);

      // Create text representation
      const text = createBusinessText(business);
      
      // Generate embedding
      const embedding = await generateEmbedding(text);
      
      // Store embedding as JSON string
      await prisma.yellowBookEntry.update({
        where: { id: business.id },
        data: {
          embedding: JSON.stringify(embedding),
        },
      });

      successCount++;
      console.log(`✅ Embedded successfully\n`);

      // Rate limiting: wait 100ms between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to embed ${business.name}:`, error);
      console.log();
    }
  }

  console.log('📈 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total: ${businesses.length}`);

  await prisma.$disconnect();
}

// Run the script
embedAllBusinesses()
  .then(() => {
    console.log('\n✨ Embedding process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
