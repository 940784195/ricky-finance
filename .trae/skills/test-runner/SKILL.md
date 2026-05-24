---
name: "test-runner"
description: "Runs unit, integration, and E2E tests for the project. Invoke when verifying code correctness or running test suites."
---

# Test Runner Skill

## Overview
This skill provides comprehensive testing capabilities including API testing (Jest + Supertest) and E2E browser testing (Playwright).

## Features
- **API Unit Tests**: Validate Express.js REST endpoints using Supertest
- **E2E Tests**: Browser automation tests for UI pages using Playwright
- **Test Data Management**: Isolated test data with auto-cleanup
- **Coverage Reports**: Code coverage tracking with thresholds
- **Watch Mode**: Auto-run tests on file changes (via test-automation-agent)
- **CI Ready**: Structured output for CI/CD integration

## Tech Stack
| Layer | Framework | Purpose |
|-------|-----------|---------|
| API Tests | Jest + Supertest | HTTP endpoint testing |
| E2E Tests | Playwright | Browser automation |
| Coverage | Jest built-in (istanbul) | Code coverage |

## Directory Convention
```
tests/
├── api/           # Backend API tests (Jest)
│   ├── records.test.js
│   ├── customers.test.js
│   └── stats.test.js
├── e2e/           # Frontend E2E tests (Playwright)
│   ├── overview.spec.js
│   ├── records.spec.js
│   └── customers.spec.js
└── helpers/
    └── setup.js   # Test environment bootstrap
```

## Usage Scenarios
- Running full test suite before deployment
- Validating API endpoint correctness
- Regression testing after code changes
- Coverage gap analysis
- Automated CI verification