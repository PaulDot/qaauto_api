import { test, expect } from '@playwright/test';

test.describe('API Pagination, Query Offset & Chunked Data Verification', () => {
    let sessionToken: string;

    test.beforeEach(async ({ request }) => {
        const resetResponse = await request.post('/api/test/reset');
        expect(resetResponse.status()).toBe(200);

        const loginResponse = await request.post('/api/login', {
            data: {
                email: 'qa_engineer@example.com',
                password: 'securePassword123'
            }
        });
        expect(loginResponse.status()).toBe(200);
        const payload = await loginResponse.json();
        sessionToken = payload.token;
    });

    test('GET /users - Should limit the data chunk size to exactly one record when limit is set to 1', async ({ request }) => {
        const response = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            params: { page: '1', limit: '1' }
        });

        expect(response.status()).toBe(200);
        const payload = await response.json();

        // 5 total records, but current page contains only 1
        expect(payload.metadata.totalRecords).toBe(5);
        expect(payload.metadata.limitPerPage).toBe(1);
        expect(payload.metadata.currentPage).toBe(1);
        expect(payload.metadata.totalPages).toBe(5);
        expect(payload.metadata.hasNextPage).toBe(true);
        expect(payload.metadata.hasPreviousPage).toBe(false);
        expect(payload.data.length).toBe(1);
        
        // Exact first record returned
        expect(payload.data[0].id).toBe(201);
    });

    test('GET /users - Should successfully shift the window offset when navigating to page 2', async ({ request }) => {
        const response = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            params: { page: '2', limit: '2' }
        });

        expect(response.status()).toBe(200);
        const payload = await response.json();

        // Page 2 (limit 2) should contain records 3 and 4 (ids 203 and 204)
        expect(payload.metadata.totalRecords).toBe(5);
        expect(payload.metadata.limitPerPage).toBe(2);
        expect(payload.metadata.currentPage).toBe(2);
        expect(payload.metadata.totalPages).toBe(3);
        expect(payload.metadata.hasNextPage).toBe(true);
        expect(payload.metadata.hasPreviousPage).toBe(true);
        expect(payload.data.length).toBe(2);
        expect(payload.data[0].id).toBe(203);
        expect(payload.data[1].id).toBe(204);
    });

    test('GET /users - Should return an empty array gracefully when querying a page that doesnt exist', async ({ request }) => {
        const response = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            params: { page: '99', limit: '5' }
        });

        expect(response.status()).toBe(200);
        const payload = await response.json();

        expect(payload.metadata.currentPage).toBe(99);
        expect(payload.metadata.totalPages).toBe(1);
        expect(payload.metadata.hasNextPage).toBe(false);
        expect(Array.isArray(payload.data)).toBe(true);
        expect(payload.data.length).toBe(0); 
    });

    test('GET /users - Should blend dynamic data filtering and pagination parameters together', async ({ request }) => {
        const response = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            params: { 
                isActive: 'true', // Matches 3 active users globally (201, 203, 204)
                page: '2', 
                limit: '2' 
            }
        });

        expect(response.status()).toBe(200);
        const payload = await response.json();

        // If 3 filtered active records, 2 on page 1 and 1 on page 2
        expect(payload.metadata.totalRecords).toBe(3);
        expect(payload.metadata.totalPages).toBe(2);
        expect(payload.metadata.currentPage).toBe(2);
        expect(payload.metadata.hasNextPage).toBe(false);
        expect(payload.data.length).toBe(1);
        expect(payload.data[0].id).toBe(204);  // last isActive user is id:204
    });
});
