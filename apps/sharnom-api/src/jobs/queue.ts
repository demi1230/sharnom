import Bull from 'bull';

// Create queue
export const embeddingQueue = new Bull('embedding-generation', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: false,   // Keep failed jobs for inspection
  },
});

// Job types
export interface EmbeddingJobPayload {
  jobId: string;
  businessId: string;
  operation: 'create' | 'update' | 'bulk' | 'retry';
  priority: 'high' | 'normal' | 'low';
  attempt: number;
  maxRetries: number;
  metadata: {
    triggeredBy: string;
    triggeredAt: string;
    source: 'api' | 'admin' | 'cron';
    originalName: string;
  };
}

// Enqueue job
export async function enqueueEmbeddingJob(
  businessId: string,
  operation: EmbeddingJobPayload['operation'],
  metadata: Partial<EmbeddingJobPayload['metadata']> = {}
) {
  const jobId = `emb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const payload: EmbeddingJobPayload = {
    jobId,
    businessId,
    operation,
    priority: operation === 'create' ? 'high' : 'normal',
    attempt: 1,
    maxRetries: 3,
    metadata: {
      triggeredBy: metadata.triggeredBy || 'system',
      triggeredAt: new Date().toISOString(),
      source: metadata.source || 'api',
      originalName: metadata.originalName || 'unknown',
    },
  };

  const job = await embeddingQueue.add('generate', payload, {
    jobId: payload.jobId,
    priority: payload.priority === 'high' ? 1 : 10,
  });

  console.log(`📨 Enqueued embedding job ${payload.jobId} for business ${businessId}`);
  
  return {
    jobId: payload.jobId,
    queueId: job.id,
    status: 'queued',
  };
}
