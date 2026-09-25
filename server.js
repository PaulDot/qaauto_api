import Fastify from 'fastify';
const fastify = Fastify({ logger: false });

let mockUserDatabase = [
    { id: 201, name: "John Murphy", profile: { role: "Senior Engineer", isActive: true } },
    { id: 202, name: "Alan O'Brien", profile: { role: "Product Owner", isActive: false } }
];

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

    let filteredDatabase = mockUserDatabase;

    // Loop through every query parameter provided in the URL
    Object.keys(request.query).forEach(key => {
        const queryValue = request.query[key];

        filteredDatabase = filteredDatabase.filter(user => {
            // Check top-level properties (e.g. user.name)
            if (user[key] !== undefined) {
                return String(user[key]) === queryValue;
            }
            
            // Check nested profile properties (e.g. user.profile.isActive)
            if (user.profile && user.profile[key] !== undefined) {
                return String(user.profile[key]) === queryValue;
            }

            return true;
        });
    });

    return {
        status: "SUCCESS",
        page: 1,
        resultsCount: filteredDatabase.length,
        data: filteredDatabase
    };
});

fastify.post('/api/users', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader !== "Bearer mock_secure_jwt_token_2026") {
        return reply.status(403).send({ error: "Forbidden: Invalid token" });
    }

    const { name, role } = request.body || {};
    if (!name || !role) {
        return reply.status(400).send({ error: "Bad Request: Missing name or role parameter" });
    }

    // Mock response mimicking a database insert generating a new ID
    return reply.status(201).send({
        id: 203,
        name,
        profile: { role, isActive: true, createdAt: "2026-09-24" }
    });
});

fastify.put('/api/users/:id', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader !== "Bearer mock_secure_jwt_token_2026") {
        return reply.status(403).send({ error: "Forbidden: Invalid token" });
    }

    const targetId = parseInt(request.params.id, 10);
    const { name, role } = request.body || {};

    if (!name || !role) {
        return reply.status(400).send({ error: "Bad Request: Missing name or role parameter" });
    }

    const user = mockUserDatabase.find(u => u.id === targetId);

    if (user) {
        user.name = name;
        user.profile.role = role;
        return reply.status(200).send(user); // 200 OK with the updated object
    }

    return reply.status(404).send({ error: "User not found" });
});

fastify.delete('/api/users/:id', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader !== "Bearer mock_secure_jwt_token_2026") {
        return reply.status(403).send({ error: "Forbidden" });
    }

    const targetId = parseInt(request.params.id, 10);
    const userIndex = mockUserDatabase.findIndex(user => user.id === targetId);

    if (userIndex !== -1) {
        mockUserDatabase.splice(userIndex, 1);  // remove user from array
        return reply.status(204).send(); 
    }
    
    return reply.status(404).send({ error: "User not found" });
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
