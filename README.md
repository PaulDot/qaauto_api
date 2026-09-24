# Enterprise REST API Test Automation Showcase

A self-contained REST API test automation sandbox built with **Playwright (TypeScript)** and **Fastify**. 

This repository serves as a demonstration of backend integration testing and negative boundary verification, without relying on external third-party API dependencies.

## 🏗️ Architectural Strategy: Zero-Flakiness Local Mocking
As this is a demo piece I didn't want to depend on a public sandbox API which can be flaky, rate-limited, and suffer data state corruption from other public users.

Instead, this project boots up a custom **in-memory Fastify application server** locally on port 3000 before running assertions, and tears it down automatically when execution ends.

## 🧪 Automated Test Coverage
The framework contains a structured, sequential end-to-end integration story mapping complete positive CRUD lifecycles and negative edge cases.

## 🚀 Local Execution
Ensure you have Node.js installed, then clone the directory and run the unified parallel pipeline script:

```bash
# Install framework dependencies
npm install

# Run the concurrent server boot and test runner sequence
npm run test:api
```

## 🔄 Continuous Integration
Every code modification or Pull Request pushed to `main` automatically triggers a **GitHub Actions CI Pipeline workflow**, spinning up an isolated virtual cloud environment to execute the automated suite headlessly.
