# Лаб 9: Background Job Design - Embedding Generation

## Executive Summary
Энэ баримт нь Yellow Book бизнесүүдийн AI embedding автоматаар үүсгэх background job-ийн дизайн, хэрэгжилтийг тодорхойлно. Embedding үүсгэлт нь Google Gemini API ашигладаг тул удаан (100-500ms), rate limit-тэй (15 RPM) учир асинхрон горимд ажиллах хэрэгтэй.

---

## 1. Feature Selection: AI Embedding Generation

### Сонгосон шалтгаан
- **API rate limits**: Gemini API 15 requests/minute free tier
- **Processing time**: Embedding бүр 100-500ms шаарддаг
- **Scalability**: 100+ бизнес нэг дор embedding хийхэд 8+ минут
- **User experience**: Админ шинэ бизнес нэмэхэд хариу хүлээлгүй шууд буцах хэрэгтэй

---

## 2. Job Design

### 2.1 Job Definition

**Job Name**: `generate-business-embedding`

**Trigger Events**:
1. **Create**: Шинэ бизнес үүсгэх үед (`POST /api/yellow-books`)
2. **Update**: Бизнесийн мэдээлэл өөрчлөгдөх үед (`PATCH /api/yellow-books/:id`)
3. **Bulk**: Олон бизнесийг нэг дор embedding хийх (`POST /api/admin/embeddings/bulk`)
4. **Retry**: Алдаатай job дахин оролдох үед (manual trigger)

**Payload Structure**:
```typescript
interface EmbeddingJobPayload {
  jobId: string;              // Unique job identifier (UUID)
  businessId: string;         // Target business ID
  operation: 'create' | 'update' | 'bulk' | 'retry';
  priority: 'high' | 'normal' | 'low';
  attempt: number;            // Current attempt (1-based)
  maxRetries: number;         // Default: 3
  metadata: {
    triggeredBy: string;      // User ID or 'system'
    triggeredAt: string;      // ISO timestamp
    source: 'api' | 'admin' | 'cron';
    originalName: string;     // For logging
  };
}
```

**Expected Outcome**:
1. Бизнесийн мэдээллийг text болгох (name + category + description + address)
2. Google Gemini API-аар embedding vector үүсгэх (768 dimensions)
3. Prisma ашиглан `embedding` талбарт JSON string хадгалах
4. Job status update (success/failed)
5. Logs бичих (CloudWatch, DB, эсвэл file)

---

### 2.2 Why Asynchronous?

| Асуудал | Синхрон | Асинхрон |
|---------|---------|----------|
| **API Response Time** | 500ms+ | <50ms |
| **Rate Limiting** | User хүлээнэ (15 RPM) | Queue-д хадгална |
| **Scalability** | 100 businesses = 8+ min | Background дээр ажиллана |
| **Error Handling** | User алдаа харна | Silent retry |
| **User Experience** | Spinner хүлээх | Instant success |

**Жишээ сценари**:
```
Админ 50 бизнес bulk import хийлээ:
- Синхрон: 50 × 300ms = 15 sec хүлээх, timeout эрсдэл
- Асинхрон: <100ms HTTP 202, background дээр 3-5 min ажиллана
```

---

### 2.3 Retry & Backoff Strategy

**Exponential Backoff with Jitter**:
```typescript
function calculateBackoff(attempt: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds
  const exponential = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  const jitter = Math.random() * 0.3 * exponential; // ±30% jitter
  return Math.floor(exponential + jitter);
}

// Attempt 1: 1s + jitter
// Attempt 2: 2s + jitter
// Attempt 3: 4s + jitter
// Attempt 4: 8s + jitter (max 3 retries by default)
```

**Retry Conditions**:
| Error Type | Retry? | Max Attempts | Backoff |
|------------|--------|--------------|---------|
| Network timeout | ✅ Yes | 3 | Exponential |
| Rate limit (429) | ✅ Yes | 5 | 60s fixed |
| Invalid API key | ❌ No | 0 | N/A |
| Business not found | ❌ No | 0 | N/A |
| Gemini server error (500) | ✅ Yes | 3 | Exponential |
| Quota exceeded | ⚠️ DLQ | 0 | Manual |

**Implementation**:
```typescript
async function processEmbeddingJob(payload: EmbeddingJobPayload) {
  try {
    // 1. Fetch business
    const business = await prisma.yellowBookEntry.findUnique({
      where: { id: payload.businessId }
    });
    
    if (!business) {
      throw new NonRetryableError('Business not found');
    }
    
    // 2. Generate embedding
    const text = createBusinessText(business);
    const embedding = await generateEmbedding(text);
    
    // 3. Save to DB
    await prisma.yellowBookEntry.update({
      where: { id: payload.businessId },
      data: { embedding: JSON.stringify(embedding) }
    });
    
    console.log(`✅ Job ${payload.jobId} completed for business ${business.name}`);
    return { status: 'success', businessId: payload.businessId };
    
  } catch (error) {
    if (error instanceof NonRetryableError) {
      console.error(`❌ Job ${payload.jobId} failed (non-retryable):`, error.message);
      await moveToDLQ(payload, error);
      return { status: 'failed', reason: error.message };
    }
    
    if (payload.attempt < payload.maxRetries) {
      const backoff = calculateBackoff(payload.attempt);
      console.warn(`⚠️ Job ${payload.jobId} failed, retry in ${backoff}ms`);
      await scheduleRetry(payload, backoff);
      return { status: 'retrying', nextAttempt: payload.attempt + 1 };
    }
    
    console.error(`💀 Job ${payload.jobId} exhausted retries:`, error);
    await moveToDLQ(payload, error);
    return { status: 'dead', reason: error.message };
  }
}
```

---

### 2.4 Idempotency Strategy

**Problem**: Ижил job 2+ удаа ажиллавал давхар embedding үүсгэх эрсдэл

**Solution**: Job ID-based deduplication

```typescript
// Redis-based idempotency key
async function isJobProcessed(jobId: string): Promise<boolean> {
  const key = `job:processed:${jobId}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

async function markJobProcessed(jobId: string): Promise<void> {
  const key = `job:processed:${jobId}`;
  await redis.setex(key, 86400, '1'); // 24 hour TTL
}

// Worker wrapper
async function processWithIdempotency(payload: EmbeddingJobPayload) {
  if (await isJobProcessed(payload.jobId)) {
    console.log(`⏭️ Job ${payload.jobId} already processed, skipping`);
    return { status: 'duplicate' };
  }
  
  const result = await processEmbeddingJob(payload);
  
  if (result.status === 'success') {
    await markJobProcessed(payload.jobId);
  }
  
  return result;
}
```

**Alternative: Database-based**
```typescript
// Prisma schema addition
model JobExecution {
  id          String   @id @default(uuid())
  jobId       String   @unique
  businessId  String
  status      String   // 'processing' | 'success' | 'failed'
  attempt     Int
  error       String?
  createdAt   DateTime @default(now())
  completedAt DateTime?
}

// Check before processing
const existing = await prisma.jobExecution.findUnique({
  where: { jobId: payload.jobId }
});

if (existing?.status === 'success') {
  return { status: 'duplicate' };
}
```

---

### 2.5 Dead Letter Queue (DLQ)

**What Goes to DLQ**:
1. **Exhausted retries**: 3+ алдаа дараалж гарсан jobs
2. **Invalid payload**: Business ID олдохгүй
3. **API quota exceeded**: Gemini free tier дууссан
4. **Permanent errors**: Invalid API key

**DLQ Payload Structure**:
```typescript
interface DLQEntry {
  originalJob: EmbeddingJobPayload;
  failureReason: string;
  errorDetails: {
    message: string;
    stack?: string;
    statusCode?: number;
  };
  attempts: Array<{
    attemptNumber: number;
    timestamp: string;
    error: string;
  }>;
  enqueuedAt: string;
  lastAttemptAt: string;
}
```

**DLQ Implementation Options**:

**Option 1: Redis List**
```typescript
async function moveToDLQ(payload: EmbeddingJobPayload, error: Error) {
  const dlqEntry: DLQEntry = {
    originalJob: payload,
    failureReason: error.message,
    errorDetails: {
      message: error.message,
      stack: error.stack,
    },
    attempts: [], // Would be populated from job history
    enqueuedAt: payload.metadata.triggeredAt,
    lastAttemptAt: new Date().toISOString(),
  };
  
  await redis.lpush('dlq:embeddings', JSON.stringify(dlqEntry));
  await redis.ltrim('dlq:embeddings', 0, 999); // Keep last 1000
}
```

**Option 2: Database Table**
```prisma
model DeadLetterQueue {
  id              String   @id @default(uuid())
  queue           String   // 'embeddings'
  jobId           String
  businessId      String
  payload         String   // JSON
  failureReason   String
  errorDetails    String   // JSON
  attemptCount    Int
  enqueuedAt      DateTime
  lastAttemptAt   DateTime
  resolvedAt      DateTime?
  resolvedBy      String?
  
  @@index([queue, enqueuedAt])
}
```

**DLQ Handling Strategy**:

1. **Monitoring Dashboard**:
```typescript
// GET /api/admin/dlq
async function getDLQStats() {
  const count = await redis.llen('dlq:embeddings');
  const recent = await redis.lrange('dlq:embeddings', 0, 9);
  
  return {
    totalFailed: count,
    recentFailures: recent.map(JSON.parse),
    oldestFailure: recent[recent.length - 1],
  };
}
```

2. **Manual Retry**:
```typescript
// POST /api/admin/dlq/retry/:jobId
async function retryFromDLQ(jobId: string) {
  const entries = await redis.lrange('dlq:embeddings', 0, -1);
  const entry = entries
    .map(JSON.parse)
    .find(e => e.originalJob.jobId === jobId);
  
  if (!entry) {
    throw new Error('Job not found in DLQ');
  }
  
  // Reset attempt counter
  const freshPayload = {
    ...entry.originalJob,
    attempt: 1,
    metadata: {
      ...entry.originalJob.metadata,
      source: 'dlq-retry' as const,
      retriedAt: new Date().toISOString(),
    },
  };
  
  await enqueueJob(freshPayload);
  await removeFromDLQ(jobId);
  
  return { status: 'requeued', jobId };
}
```

3. **Alerting**:
```typescript
// Alert when DLQ exceeds threshold
async function checkDLQAlerts() {
  const count = await redis.llen('dlq:embeddings');
  
  if (count > 50) {
    await sendAlert({
      severity: 'high',
      message: `DLQ has ${count} failed jobs`,
      action: 'Review /api/admin/dlq',
    });
  }
}
```

---

## 3. Code Implementation

### 3.1 Project Structure
```
apps/sharnom-api/
├── src/
│   ├── main.ts                    # API handlers
│   ├── jobs/
│   │   ├── queue.ts               # Queue setup (Bull/BullMQ)
│   │   ├── workers/
│   │   │   └── embedding-worker.ts # Worker implementation
│   │   └── types.ts               # Job payload types
│   └── services/
│       └── embedding.service.ts   # Embedding generation logic
└── package.json
```

### 3.2 Dependencies
```bash
npm install bull ioredis uuid
npm install -D @types/bull
```

### 3.3 Queue Setup (`src/jobs/queue.ts`)

```typescript
import Bull from 'bull';
import Redis from 'ioredis';

// Redis connection (reuse existing)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

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
  const payload: EmbeddingJobPayload = {
    jobId: `emb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
```

### 3.4 API Handler Integration (`src/main.ts`)

```typescript
import { embeddingQueue, enqueueEmbeddingJob } from './jobs/queue';

// Existing POST /api/yellow-books handler
app.post('/api/yellow-books', requireAdmin, async (req, res) => {
  try {
    const validated = YellowBookEntrySchema.parse(req.body);
    
    // 1. Create business WITHOUT embedding (sync)
    const entry = await prisma.yellowBookEntry.create({
      data: {
        ...validated,
        embedding: null, // Will be filled by background job
      },
    });
    
    // 2. Enqueue embedding job (async)
    const job = await enqueueEmbeddingJob(
      entry.id,
      'create',
      {
        triggeredBy: (req as AuthRequest).user?.id || 'unknown',
        source: 'api',
        originalName: entry.name,
      }
    );
    
    // 3. Return immediately
    return res.status(201).json({
      ...entry,
      _embeddingJob: {
        id: job.jobId,
        status: 'queued',
        message: 'Embedding will be generated in background',
      },
    });
    
  } catch (error) {
    console.error('Error creating yellow book entry:', error);
    return res.status(400).json({ error: 'Invalid data' });
  }
});

// New: Bulk embedding endpoint
app.post('/api/admin/embeddings/bulk', requireAdmin, async (req, res) => {
  try {
    const { businessIds } = req.body as { businessIds: string[] };
    
    const jobs = await Promise.all(
      businessIds.map(id => enqueueEmbeddingJob(id, 'bulk', {
        triggeredBy: (req as AuthRequest).user?.id || 'admin',
        source: 'admin',
      }))
    );
    
    return res.json({
      queued: jobs.length,
      jobs: jobs.map(j => ({ jobId: j.jobId, status: j.status })),
    });
    
  } catch (error) {
    return res.status(500).json({ error: 'Failed to queue jobs' });
  }
});

// New: Job status endpoint
app.get('/api/admin/jobs/:jobId', requireAdmin, async (req, res) => {
  const { jobId } = req.params;
  const job = await embeddingQueue.getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const state = await job.getState();
  const progress = job.progress();
  
  return res.json({
    jobId: job.id,
    businessId: job.data.businessId,
    state,
    progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
  });
});
```

### 3.5 Log-Only Worker (`src/jobs/workers/embedding-worker.ts`)

```typescript
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

console.log('👷 Embedding worker started, waiting for jobs...');
```

### 3.6 Start Worker Script

**package.json**:
```json
{
  "scripts": {
    "worker": "tsx src/jobs/workers/embedding-worker.ts"
  }
}
```

**Start commands**:
```bash
# Terminal 1: API server
npm run dev

# Terminal 2: Worker
npm run worker
```

---

## 4. Testing

### 4.1 Manual Test

```bash
# 1. Create business (triggers job)
curl -X POST http://localhost:3000/api/yellow-books \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Coffee Shop",
    "category": "Cafe",
    "address": "123 Main St",
    "phone": "555-1234",
    "description": "Best coffee in town"
  }'

# Response:
# {
#   "id": "...",
#   "name": "Test Coffee Shop",
#   "_embeddingJob": {
#     "id": "emb-1234567890-abc",
#     "status": "queued"
#   }
# }

# 2. Check job status
curl http://localhost:3000/api/admin/jobs/emb-1234567890-abc

# 3. Check worker logs (Terminal 2):
# ╔════════════════════════════════════════════════════════════
# ║ 🔄 PROCESSING EMBEDDING JOB
# ║ Job ID:        emb-1234567890-abc
# ║ Business:      Test Coffee Shop
# ╚════════════════════════════════════════════════════════════
```

### 4.2 Bulk Test

```bash
# Bulk generate embeddings for all businesses
curl -X POST http://localhost:3000/api/admin/embeddings/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "businessIds": ["id1", "id2", "id3"]
  }'
```

---

## 5. Production Considerations

### 5.1 Monitoring
- **Queue metrics**: Job count, processing rate, failure rate
- **Worker health**: CPU, memory, restart count
- **DLQ size**: Alert when > 50 failed jobs
- **API rate limits**: Track Gemini API usage

### 5.2 Scaling
- **Horizontal**: Multiple worker instances (Bull supports clustering)
- **Vertical**: Increase worker concurrency
- **Priority queues**: Separate high/low priority queues

### 5.3 Cost Optimization
- **Batch API calls**: Group embeddings if Gemini supports batch
- **Smart invalidation**: Only regenerate on significant text changes
- **Cache embeddings**: Avoid duplicate generation for similar text

---

## Conclusion

Энэ дизайн нь embedding generation-ийг синхрон API handler-аас салгаж, найдвартай асинхрон систем болгоно. Bull queue, exponential backoff, idempotency, болон DLQ ашиглаж production-ready шийдэл бий болгосон.

**Давуу талууд**:
- ⚡ Хурдан API response (<50ms)
- 🔄 Автомат retry logic
- 📊 Job tracking & monitoring
- 💪 Scalable architecture
- 🛡️ Error isolation

**Хэрэгжилтийн төлөв**:
- ✅ Queue setup
- ✅ Enqueue from API
- ✅ Log-only worker
- ⏳ Full implementation (Gemini API call)
- ⏳ DLQ handling UI
