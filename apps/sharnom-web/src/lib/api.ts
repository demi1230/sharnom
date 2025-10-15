const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getYellowBooks() {
  const response = await fetch(`${API_URL}/yellow-books`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch yellow books');
  }
  
  return response.json();
}

export async function getYellowBook(id: string) {
  const response = await fetch(`${API_URL}/yellow-books/${id}`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch yellow book');
  }
  
  return response.json();
}
