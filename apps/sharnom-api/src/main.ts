import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { YellowBookEntrySchema } from '@sharnom/contracts';

const host = process.env.HOST ?? 'localhost';
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

// GET /yellow-books - List all entries
app.get('/yellow-books', async (req, res) => {
  try {
    const entries = await prisma.yellowBookEntry.findMany({
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

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
