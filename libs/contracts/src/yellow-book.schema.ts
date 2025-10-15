import { z } from "zod";

export const YellowBookEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  address: z.string(),
  phone: z.string(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  category: z.union([
    z.literal("restaurant"),
    z.literal("store"),
    z.literal("service"),
    z.literal("technology"),
    z.literal("healthcare"),
  ]),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.number().min(0).max(5).optional(),
  employees: z.string().optional(),
  founded: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type YellowBookEntry = z.infer<typeof YellowBookEntrySchema>;
