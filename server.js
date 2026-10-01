import Fastify from 'fastify';
import fs from 'fs';

const fastify = Fastify({ logger: false });

let mockUserDatabase = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));

fastify.post('/api/test/reset', async (request, reply) => {
    mockUserDatabase = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    return { status: "RESET_SUCCESSFUL" };
});

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

    // for pagination:
    const page = parseInt(request.query.page, 10) || 1;
    const limit = parseInt(request.query.limit, 10) || 10;

    let filteredDatabase = mockUserDatabase;

    // Loop through every query parameter provided in the URL
    Object.keys(request.query).forEach(key => {
        if (key === 'page' || key === 'limit') return;  // skip for pagination params

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

    const totalRecords = filteredDatabase.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedData = filteredDatabase.slice(startIndex, endIndex);

    return {
        status: "SUCCESS",
        metadata: {
            currentPage: page,
            limitPerPage: limit,
            totalRecords: totalRecords,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        },
        data: paginatedData
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

    const highestId = mockUserDatabase.reduce((max, user) => user.id > max ? user.id : max, 0);
    const newId = highestId + 1;

    const newUser = {
        id: newId,
        name,
        profile: {
            role,
            isActive: true
        }
    };

    // Push the new user into in-memory array database
    mockUserDatabase.push(newUser);

    return reply.status(201).send(newUser);
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
