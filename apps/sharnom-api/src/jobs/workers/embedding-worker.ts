import { embeddingQueue, EmbeddingJobPayload } from '../queue';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Process jobs
embeddingQueue.process('generate', async (job) => {
  const payload: EmbeddingJobPayload = job.data;
  
  console.log(`
╔════════════════════════════════════════════════════════════
║ 🔄 PROCESSING EMBEDDING JOB
╠════════════════════════════════════════════════════════════
║ Job ID:        ${payload.jobId}
║ Business ID:   ${payload.businessId}
║ Operation:     ${payload.operation}
║ Attempt:       ${payload.attempt}/${payload.maxRetries}
║ Priority:      ${payload.priority}
║ Triggered by:  ${payload.metadata.triggeredBy}
║ Source:        ${payload.metadata.source}
║ Triggered at:  ${payload.metadata.triggeredAt}
╚════════════════════════════════════════════════════════════
  `);
  
  // Simulate progress
  await job.progress(10);
  
  try {
    // 1. Fetch business
    const business = await prisma.yellowBookEntry.findUnique({
      where: { id: payload.businessId },
    });
    
    if (!business) {
      throw new Error(`Business ${payload.businessId} not found`);
    }
    
    console.log(`📄 Business: ${business.name} (${business.category})`);
    await job.progress(30);
    
    // 2. Prepare text
    const text = `${business.name} ${business.category} ${business.description || ''} ${business.address}`;
    console.log(`📝 Text length: ${text.length} characters`);
    await job.progress(50);
    
    // 3. LOG ONLY - Simulate embedding generation
    console.log(`🤖 [SIMULATED] Calling Gemini API for embedding...`);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
    console.log(`✅ [SIMULATED] Received 768-dimensional embedding vector`);
    await job.progress(80);
    
    // 4. LOG ONLY - Simulate database update
    console.log(`💾 [SIMULATED] Saving embedding to database...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`✅ [SIMULATED] Database updated successfully`);
    await job.progress(100);
    
    console.log(`
╔════════════════════════════════════════════════════════════
║ ✅ JOB COMPLETED SUCCESSFULLY
╠════════════════════════════════════════════════════════════
║ Job ID:        ${payload.jobId}
║ Business:      ${business.name}
║ Duration:      ~400ms (simulated)
║ Status:        SUCCESS
╚════════════════════════════════════════════════════════════
    `);
    
    return {
      status: 'success',
      businessId: payload.businessId,
      businessName: business.name,
    };
    
  } catch (error) {
    console.error(`
╔════════════════════════════════════════════════════════════
║ ❌ JOB FAILED
╠════════════════════════════════════════════════════════════
║ Job ID:        ${payload.jobId}
║ Attempt:       ${payload.attempt}/${payload.maxRetries}
║ Error:         ${error instanceof Error ? error.message : 'Unknown'}
╚════════════════════════════════════════════════════════════
    `);
    
    throw error; // Bull will handle retry
  }
});

// Event listeners
embeddingQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

embeddingQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

embeddingQueue.on('stalled', (job) => {
  console.warn(`⚠️ Job ${job.id} stalled`);
});

embeddingQueue.on('error', (error) => {
  console.error('❌ Queue error:', error);
});

console.log('👷 Embedding worker started, waiting for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Shutting down worker...');
  await embeddingQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});
