import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Provide a minimal localStorage stub so the module can load in Node
const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => storage.set(k, v),
  removeItem: (k: string) => storage.delete(k),
  clear: () => storage.clear(),
});

// Mock import.meta.env before importing module under test
vi.stubEnv('VITE_API_URL', 'https://test.example.com');

const { apiSignup, apiLogin } = await import('./api');

describe('API client – non-JSON response handling', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    storage.clear();
  });

  afterEach(() => {
    fetchSpy.mockReset();
  });

  it('throws a readable error when the server returns non-JSON on a 500', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('A server error occurred', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      })
    );

    await expect(apiSignup('a@b.com', 'password', 'Test')).rejects.toThrow(
      'A server error occurred (500)'
    );
  });

  it('throws a readable error when the server returns non-JSON on a 200', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    );

    await expect(apiLogin('a@b.com', 'password')).rejects.toThrow(
      'Invalid server response'
    );
  });

  it('surfaces the server error message from a valid JSON error response', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Account already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(apiSignup('a@b.com', 'password', 'Test')).rejects.toThrow(
      'Account already exists'
    );
  });

  it('returns data on a successful JSON response', async () => {
    const mockResponse = {
      token: 'jwt-token',
      user: {
        id: '1',
        email: 'a@b.com',
        name: 'Test',
        role: 'parent',
        createdAt: '2024-01-01',
      },
    };

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await apiSignup('a@b.com', 'password', 'Test');
    expect(result).toEqual(mockResponse);
  });
});
