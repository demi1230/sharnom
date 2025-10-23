const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ISR-enabled fetch for yellow books list (revalidate every 60s)
export async function getYellowBooks() {
  const response = await fetch(`${API_URL}/yellow-books`, {
    next: { revalidate: 60 },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch yellow books');
  }
  
  return response.json();
}

// SSG-enabled fetch for individual yellow book (cached, revalidated on-demand)
export async function getYellowBook(id: string) {
  const response = await fetch(`${API_URL}/yellow-books/${id}`, {
    next: { revalidate: false }, // Cache forever, revalidate on-demand
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch yellow book');
  }
  
  return response.json();
}

// SSR-enabled fetch for search (no caching)
export async function searchYellowBooks(query: string) {
  const response = await fetch(`${API_URL}/yellow-books?search=${encodeURIComponent(query)}`, {
    cache: 'no-store', // SSR: always fresh data
  });
  
  if (!response.ok) {
    throw new Error('Failed to search yellow books');
  }
  
  return response.json();
}
