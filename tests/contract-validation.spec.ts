import { test, expect } from '@playwright/test';
import { z } from 'zod';
// below all based on mockUserDatabase defined in server.js

const UserProfileSchema = z.object({
    role: z.string(),
    isActive: z.boolean()
});

const UserRecordSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    profile: UserProfileSchema
});

const GetUsersResponseSchema = z.object({
    status: z.string(),
    metadata: z.object({
        currentPage: z.number().int(),
        limitPerPage: z.number().int(),
        totalRecords: z.number().int(),
        totalPages: z.number().int(),
        hasNextPage: z.boolean(),
        hasPreviousPage: z.boolean()
    }),
    data: z.array(UserRecordSchema) // Guarantees every element in the array matches the contract
});

test.describe('API Schema Contract & Type Compliance', () => {
    let sessionToken: string;

    test.beforeAll(async ({ request }) => {
        const response = await request.post('/api/login', {
            data: {
                email: 'qa_engineer@example.com',
                password: 'securePassword123'
            }
        });
        expect(response.status()).toBe(200);
        const payload = await response.json();
        sessionToken = payload.token;
    });

    test('GET /users - Response data must strictly comply with the Zod schema contract', async ({ request }) => {
        const response = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });

        expect(response.status()).toBe(200);
        const payload = await response.json();

        //  parse without erroring loudly
        const contractCheck = GetUsersResponseSchema.safeParse(payload);

        // If the contract fails, print the issue out to the log
        if (!contractCheck.success) {
            console.error('🛑 CONTRACT BREACH DETECTED:\n', z.prettifyError(contractCheck.error));
        }

        expect(contractCheck.success).toBe(true);
    });
});
