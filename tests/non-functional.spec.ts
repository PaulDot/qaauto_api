import { test, expect } from '@playwright/test';

test.describe('API Non-Functional Verification & Performance SLAs', () => {
    let sessionToken: string;

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`/api/login`, {
            data: {
                email: 'qa_engineer@example.com',
                password: 'securePassword123'
            }
        });

        expect(response.status()).toBe(200);
        const payload = await response.json();

        sessionToken = payload.token;
        expect(sessionToken).toBeDefined();
    });

    test('GET /users - Response time must be under 200ms to meet enterprise performance targets', async ({ request }) => {
        const startTime = performance.now();  // more granular than Date.now()
        
        const response = await request.get(`/api/users`, {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        
        const endTime = performance.now();
        const latencyMs = endTime - startTime;

        console.log(`\n⏱️ Performance SLA Benchmark: GET /api/users resolved in ${latencyMs.toFixed(2)}ms`);

        expect(response.status()).toBe(200);
        expect(latencyMs).toBeLessThan(200);  // 200ms
    });

    test('GET /users - Response headers must securely enforce JSON formats and hide internal server metrics', async ({ request }) => {
        const response = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        const headers = response.headers();

        expect(headers['content-type']).toContain('application/json');
        
        // Ensure stack details not obviously revealed
        expect(headers['x-powered-by']).toBeUndefined();
    });

    test('GET /users - Response data size must fit within performance bandwidth budget', async ({ request }) => {
        const response = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        
        const rawBody = await response.body();
        const bodySizeInBytes = rawBody.length;

        console.log(`📦 Bandwidth Budget: Payload footprint is exactly ${bodySizeInBytes} bytes`);

        expect(bodySizeInBytes).toBeLessThan(1024); // Payload must be under 1KB
    });

    test('GET /users - Unauthenticated requests must be blocked immediately with minimal latency footprint', async ({ request }) => {
        const startTime = performance.now();
        
        const response = await request.get('/api/users', {
            headers: { 'Authorization': 'Bearer invalid_token_abc' } // Intentional bad token
        });
        
        const endTime = performance.now();
        const latencyMs = endTime - startTime;

        console.log(`\n⏱️ Unauth Req Benchmark: Unauthenticated GET /api/users resolved in ${latencyMs.toFixed(2)}ms`);

        expect(response.status()).toBe(403);
        expect(latencyMs).toBeLessThan(50);  // should be nearly instant
    });
});
