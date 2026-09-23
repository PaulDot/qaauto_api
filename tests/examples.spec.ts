import { test, expect } from '@playwright/test';

test.describe('REST API Integration Suite', () => {
    let sessionToken: string;

    test.beforeAll(async ({request}) => {
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

    test('GET /users - Should successfully provide secure nested data layouts', async ({ request }) => {
        const response = await request.get(`/api/users`, {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        expect(response.status()).toBe(200);
        const payload = await response.json();

        expect(payload.status).toBe("SUCCESS");
        expect(Array.isArray(payload.data)).toBe(true);
        expect(payload.data.length).toBe(2);

        const firstUser = payload.data[0];
        expect(firstUser.id).toBe(201);
        expect(firstUser.name).toBe("John Murphy");
        expect(firstUser.profile?.role).toBe("Senior Engineer");
        expect(firstUser.profile?.isActive).toBe(true);
    });
})
