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

        test('GET /users?isActive=true - Should successfully filter resources using query constraints', async ({ request }) => {
        const response = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            params: {
                isActive: 'true'
            }
        });

        expect(response.status()).toBe(200);
        const payload = await response.json();

        expect(payload.resultsCount).toBe(1);
        expect(payload.data.length).toBe(1);
        
        const activeUser = payload.data[0];
        expect(activeUser.id).toBe(201);
        expect(activeUser.name).toBe("John Murphy");
        expect(activeUser.profile?.isActive).toBe(true);
    });

    test('POST /users - Should successfully instantiate a new user entity with 201 Created status', async ({ request }) => {
        const response = await request.post('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            data: {
                name: "Kate Smith",
                role: "QA Lead"
            }
        });

        expect(response.status()).toBe(201);  // 201 expected for creation
        const payload = await response.json();

        expect(payload.id).toBe(203);
        expect(payload.name).toBe("Kate Smith");
        expect(payload.profile?.role).toBe("QA Lead");
        expect(payload.profile?.isActive).toBe(true);
    });

     test('POST /users - Should return 400 Bad Request if mandatory parameters are missing', async ({ request }) => {
        const response = await request.post('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            data: {
                name: "Invalid Incomplete User"
                // 'role' field left out
            }
        });

        expect(response.status()).toBe(400);
        const errorPayload = await response.json();
        expect(errorPayload.error).toContain("Missing name or role");
    });

    test('PUT /users/:id - Should successfully update an existing resource and verify state modification', async ({ request }) => {
        const updateResponse = await request.put('/api/users/201', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            data: {
                name: "John Fitzgerald Murphy",
                role: "Technical Architect"
            }
        });
        expect(updateResponse.status()).toBe(200);

        const getResponse = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        expect(getResponse.status()).toBe(200);
        
        const payload = await getResponse.json();
        const updatedUser = payload.data.find((user: any) => user.id === 201);
        
        expect(updatedUser.name).toBe("John Fitzgerald Murphy");
        expect(updatedUser.profile?.role).toBe("Technical Architect");
    });


    test('DELETE /users/:id - Should remove user entity and confirm missing state on subsequent GET', async ({ request }) => {
        const deleteResponse = await request.delete('/api/users/202', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        expect(deleteResponse.status()).toBe(204);

        const getResponse = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        expect(getResponse.status()).toBe(200);        
        const payload = await getResponse.json();
        
        // Assert that user ID 202 is absent from the returned data
        const userExists = payload.data.some((user: any) => user.id === 202);
        expect(userExists).toBe(false); 
        expect(payload.resultsCount).toBe(1);
    });

    test('POST /api/login - Should return 401 Unauthorized when credentials are invalid', async ({ request }) => {
        const response = await request.post('/api/login', {
            data: {
                email: 'attacker@badactor.com',
                password: 'wrongPassword123'
            }
        });

        expect(response.status()).toBe(401);
        
        const payload = await response.json();
        expect(payload.error).toBe("Invalid credentials");
    });

    test('GET /api/users - Should return 403 Forbidden when Authorization header is entirely omitted', async ({ request }) => {
        // No headers object at all passed here
        const response = await request.get('/api/users');

        expect(response.status()).toBe(403);
        
        const payload = await response.json();
        expect(payload.error).toContain("Forbidden");
    });

    test('GET /users?role=NonExistent - Should return 200 OK with an empty array when no records match the filter', async ({ request }) => {
        const response = await request.get('/api/users', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            params: {
                role: 'CEO'
            }
        });

        expect(response.status()).toBe(200);
        const payload = await response.json();

        expect(payload.status).toBe("SUCCESS");
        expect(payload.resultsCount).toBe(0);
        expect(Array.isArray(payload.data)).toBe(true);
        expect(payload.data.length).toBe(0); // The array exists but is empty
    });


    test('PUT /users/:id - Should return 404 Not Found when attempting to update a non-existent ID', async ({ request }) => {
        const response = await request.put('/api/users/9999', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            data: {
                name: "Ghost User",
                role: "Unknown Role"
            }
        });

        expect(response.status()).toBe(404);
        
        const payload = await response.json();
        expect(payload.error).toBe("User not found");
    });

    test('DELETE /api/users/:id - Should return 404 Not Found when attempting to delete a non-existent ID', async ({ request }) => {
        const response = await request.delete('/api/users/9999', {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        expect(response.status()).toBe(404);
        
        const payload = await response.json();
        expect(payload.error).toBe("User not found");
    });
})
