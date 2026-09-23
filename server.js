import Fastify from 'fastify';
const fastify = Fastify({ logger: false });

fastify.post('/api/login', async (request, reply) => {
    const { email, password } = request.body || {};
    
    if (email === "qa_lead@example.com" || email === "qa_engineer@example.com") {
        if (password === "securePassword123") {
            return { token: "mock_secure_jwt_token_2026" };
        }
    }
    return reply.status(401).send({ error: "Invalid credentials" });
});

fastify.get('/api/users', async (request, reply) => {
    const authHeader = request.headers.authorization;
    
    if (authHeader !== "Bearer mock_secure_jwt_token_2026") {
        return reply.status(403).send({ error: "Forbidden: Invalid or missing token" });
    }
    
    return {
        status: "SUCCESS",
        page: 1,
        resultsCount: 2,
        data: [
            { id: 201, name: "John Murphy", profile: { role: "Senior Engineer", isActive: true } },
            { id: 202, name: "Alan O'Brien", profile: { role: "Product Owner", isActive: false } }
        ]
    };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '127.0.0.1' });
        console.log("🚀 Mock Production REST API running at http://127.0.0.1:3000");
    } catch (err) {
        process.exit(1);
    }
};
start();
