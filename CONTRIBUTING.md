# Contributing to Orbital Nexus

Thank you for your interest in contributing to Orbital Nexus! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue tracker to see if the problem has already been reported. If it has and the issue is still open, add a comment to the existing issue instead of opening a new one.

When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Describe the behavior you observed and what you expected to see
- Include screenshots if possible
- Include details about your configuration and environment

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide the following information:

- Use a clear and descriptive title
- Provide a detailed description of the suggested enhancement
- Explain why this enhancement would be useful to most users
- Specify which part of the codebase this enhancement would affect

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Include screenshots and animated GIFs in your pull request whenever possible
- Follow the TypeScript style guide
- Include tests when adding new features
- Update documentation for changes that affect the API or user experience

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Project Structure

The project is organized as follows:

```
├── client/ - Admin dashboard frontend
│   └── src/
│       ├── components/ - React components
│       ├── contexts/ - React contexts
│       ├── hooks/ - Custom React hooks
│       ├── lib/ - Utility functions
│       └── pages/ - Dashboard pages
├── server/ - Backend server code
│   ├── aoi.ts - Area of Interest management
│   ├── celestial.ts - Celestial body simulation
│   ├── index.ts - Server entry point
│   ├── mission.ts - Mission system
│   ├── npc.ts - NPC management
│   ├── routes.ts - HTTP API endpoints
│   ├── state.ts - Game state management
│   └── storage.ts - Data persistence
└── shared/ - Shared code between client and server
    ├── math.ts - Math utilities
    ├── physics.ts - Physics calculations
    ├── schema.ts - Data schemas
    └── types.ts - TypeScript type definitions
```

## Style Guide

### TypeScript

- Use TypeScript for all code
- Follow the tslint/eslint configuration provided in the project
- Document all public methods and interfaces with JSDoc comments
- Use interface over type when possible
- Prefer readonly properties when they should not be modified

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Testing

- Write tests for all new features
- Run existing tests before submitting a pull request
- Ensure all tests pass before submitting a pull request

## Documentation

- Update documentation when necessary
- Use clear and consistent terminology
- Include code examples for API methods

## Questions?

Feel free to open an issue with your question or contact the maintainers directly.

Thank you for contributing to Orbital Nexus!