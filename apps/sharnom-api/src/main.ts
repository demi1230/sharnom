import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { YellowBookEntrySchema } from '@sharnom/contracts';
import { requireAdmin, AuthRequest } from './middleware/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Redis from 'ioredis';
import { embeddingQueue, enqueueEmbeddingJob } from './jobs/queue';

const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
const prisma = new PrismaClient();

// Initialize Google Gemini (optional for Lab 8)
const genAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

// Initialize Redis client (optional for Lab 8)
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => {
    if (times > 3) return null; // Stop retrying after 3 attempts
    return Math.min(times * 100, 2000); // Exponential backoff
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
}) : null;

// Test Redis connection
if (redis) {
  redis.connect().then(() => {
    console.log('✅ Redis connected successfully');
  }).catch((err) => {
    console.error('❌ Redis connection failed:', err.message);
  });
}

// Type for Prisma YellowBookEntry
type PrismaEntry = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string;
  website: string | null;
  email: string | null;
  category: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  employees: string | null;
  founded: number | null;
  embedding: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Middleware
app.use(cors());
app.use(express.json());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.get('/', (req, res) => {
  res.send({ message: 'Yellowbook API' });
});

// GET /yellow-books 
app.get('/yellow-books', async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    
    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { category: { contains: search } },
            { address: { contains: search } },
          ],
        }
      : undefined;

    const entries = await prisma.yellowBookEntry.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Convert to match schema
    const validatedEntries = entries.map((entry: PrismaEntry) => ({
      id: entry.id,
      name: entry.name,
      description: entry.description || undefined,
      address: entry.address,
      phone: entry.phone,
      website: entry.website || undefined,
      email: entry.email || undefined,
      category: entry.category,
      latitude: entry.latitude,
      longitude: entry.longitude,
      rating: entry.rating || undefined,
      employees: entry.employees || undefined,
      founded: entry.founded || undefined,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    res.json(validatedEntries);
  } catch (error) {
    console.error('Error fetching yellow book entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /yellow-books/:id - Get single entry
app.get('/yellow-books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await prisma.yellowBookEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const validatedEntry = {
      id: entry.id,
      name: entry.name,
      description: entry.description || undefined,
      address: entry.address,
      phone: entry.phone,
      website: entry.website || undefined,
      email: entry.email || undefined,
      category: entry.category,
      latitude: entry.latitude,
      longitude: entry.longitude,
      rating: entry.rating || undefined,
      employees: entry.employees || undefined,
      founded: entry.founded || undefined,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };

    return res.json(validatedEntry);
  } catch (error) {
    console.error('Error fetching yellow book entry:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /yellow-books - Create new entry
app.post('/yellow-books', async (req, res) => {
  try {
    const validationResult = YellowBookEntrySchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    }).safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.issues,
      });
    }

    const entry = await prisma.yellowBookEntry.create({
      data: {
        name: validationResult.data.name,
        description: validationResult.data.description,
        address: validationResult.data.address,
        phone: validationResult.data.phone,
        website: validationResult.data.website,
        email: validationResult.data.email,
        category: validationResult.data.category,
        latitude: validationResult.data.latitude,
        longitude: validationResult.data.longitude,
        rating: validationResult.data.rating,
        employees: validationResult.data.employees,
        founded: validationResult.data.founded,
      },
    });

    // Lab 9: Enqueue background job for embedding generation
    const job = await enqueueEmbeddingJob(
      entry.id,
      'create',
      {
        triggeredBy: 'api',
        source: 'api',
        originalName: entry.name,
      }
    );

    return res.status(201).json({
      ...entry,
      _embeddingJob: {
        id: job.jobId,
        status: job.status,
        message: 'Embedding will be generated in background',
      },
    });
  } catch (error) {
    console.error('Error creating yellow book entry:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// ADMIN ROUTES (Protected with role guard)
// ============================================

// GET /admin/users - List all users (admin only)
app.get('/admin/users', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /admin/users/:id/role - Update user role (admin only)
app.patch('/admin/users/:id/role', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    
    return res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /admin/yellow-books/:id - Delete entry (admin only)
app.delete('/admin/yellow-books/:id', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.yellowBookEntry.delete({ where: { id } });
    return res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// LAB 9: BACKGROUND JOB ENDPOINTS
// ============================================

// POST /admin/embeddings/bulk - Bulk generate embeddings
app.post('/admin/embeddings/bulk', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { businessIds } = req.body as { businessIds?: string[] };
    
    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return res.status(400).json({ error: 'businessIds array is required' });
    }
    
    const jobs = await Promise.all(
      businessIds.map(id => enqueueEmbeddingJob(id, 'bulk', {
        triggeredBy: req.user?.id || 'admin',
        source: 'admin',
      }))
    );
    
    return res.json({
      queued: jobs.length,
      jobs: jobs.map(j => ({ jobId: j.jobId, status: j.status })),
    });
    
  } catch (error) {
    console.error('Error queuing bulk embeddings:', error);
    return res.status(500).json({ error: 'Failed to queue jobs' });
  }
});

// GET /admin/jobs/:jobId - Get job status
app.get('/admin/jobs/:jobId', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
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
      data: job.data,
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: Calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// POST /api/ai/yellow-books/search - AI-powered semantic search
app.post('/api/ai/yellow-books/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // DEMO MODE: If Gemini is not configured, use basic search
    if (!genAI) {
      
      const searchTerm = query.toLowerCase();
      const businesses = await prisma.yellowBookEntry.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { category: { contains: searchTerm } },
          ],
        },
        take: 10,
      });

      return res.json({
        query,
        answer: `Found ${businesses.length} businesses matching "${query}". Note: This is demo mode - AI features require OPENAI_API_KEY to be configured for semantic search and smart answers.`,
        results: businesses.map(b => ({ ...b, score: 0.85 })),
        timestamp: new Date().toISOString(),
        cached: false,
        demoMode: true,
      });
    }

    // Check cache first
    const cacheKey = `search:${query}`;
    // @ts-ignore
    const cached = redis ? await redis.get(cacheKey) : null;
    
    if (cached) {
      console.log('✅ Cache HIT for query:', query);
      return res.json({ ...JSON.parse(cached), cached: true });
    } else {
      console.log('❌ Cache MISS for query:', query);
    }

    // Generate embedding for query
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const queryEmbeddingResult = await embeddingModel.embedContent(query);
    const queryEmbedding = queryEmbeddingResult.embedding.values;

    // Get all businesses with embeddings
    const businesses = await prisma.yellowBookEntry.findMany({
      where: {
        // @ts-ignore - Prisma types not refreshed in IDE
        NOT: {
          embedding: null,
        },
      },
    });

    // Calculate similarity scores
    const results = businesses
      .map((business) => {
        // @ts-ignore - Prisma types not refreshed in IDE
        if (!business.embedding) return null;
        // @ts-ignore - Prisma types not refreshed in IDE
        const businessEmbedding = JSON.parse(business.embedding);
        const similarity = cosineSimilarity(queryEmbedding, businessEmbedding);
        return {
          ...business,
          embedding: undefined, // Don't send embedding to client
          similarity,
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null && result.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3); 

    // Generate simple answer based on results count (AI chat models not available with this API key)
    const answer = results.length > 0 
      ? `Found ${results.length} businesses matching your query. Top result: ${results[0].name} (${results[0].category}) - ${results[0].description || 'No description available'}.`
      : `No businesses found matching your query "${query}".`;

    const response = {
      query,
      answer,
      results: results.map(({ similarity, ...business }) => ({
        ...business,
        score: similarity,
      })),
      timestamp: new Date().toISOString(),
    };

    // Cache for 1 hour
    if (redis) {
      // @ts-ignore
      await redis.setex(cacheKey, 3600, JSON.stringify(response));
      console.log('💾 Cached result for query:', query);
    }

    return res.json({ ...response, cached: false });
  } catch (error) {
    console.error('Error in AI search:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
