import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { YellowBookEntrySchema } from '@sharnom/contracts';
import { requireAdmin, AuthRequest } from './middleware/auth';

const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
const prisma = new PrismaClient();

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

    return res.status(201).json(entry);
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

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
