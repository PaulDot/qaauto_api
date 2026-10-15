import { test, expect } from '@playwright/test';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = './data/system_status.db';

test.describe('REST API to Relational Database Integration Suite', () => {
    let sessionToken: string;

    test.beforeEach(async ({ request }) => {
        await request.post('/api/test/reset');
        const loginResponse = await request.post('/api/login', {
            data: { email: 'qa_engineer@example.com', password: 'securePassword123' }
        });
        const payload = await loginResponse.json();
        sessionToken = payload.token;
    });

    test('Verification Loop - API status records must match raw SQL table states', async ({ request }) => {
        const response = await request.get('/api/system/status', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        expect(response.status()).toBe(200);
        const payload = await response.json();
        expect(payload.services.length).toBe(2);

        const db = new DatabaseSync(DB_PATH);
        const query = db.prepare("SELECT * FROM platform_status WHERE is_operational = 0");
        const dbRows: any = query.all(); 
        db.close();

        expect(dbRows.length).toBe(1);
        expect(dbRows[0].service_name).toBe('payment-gateway');
        expect(dbRows[0].version).toBe('v3.1.2');
    });
});
