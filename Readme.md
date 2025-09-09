# 🚀 Modern TypeScript Monorepo Project for Realtime Markdown Editor

A fully-featured **TypeScript Monorepo** setup with modern tooling, workspaces, and best practices.  
This repository demonstrates how to organize, build, and scale a monorepo for production-ready projects.

---

## 📦 Features

- **Monorepo Management** with [pnpm workspaces](https://pnpm.io/workspaces)
- **TypeScript** (strict mode, path aliases, project references)
- **Linting & Formatting** with [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)
- **Build System** using [tsup](https://nx.dev/)
- **Scalable Project Structure** for packages and apps

---

## 🗂️ Project Structure

```txt
.
├── apps/                  # Application-level projects
│   ├── ui/                # Example Next.js app
│   └── api/               # Example API app
├── packages/              # Shared packages
│   ├── logger/            # Shared Logger utils
├── pnpm-workspace.yaml    # Workspace configuration
└── package.json
└── nx.json
```

---

## ⚙️ Setup

Prerequisites
- Node.js >= 18
- pnpm >= 9

---

## Install Dependencies

```sh
pnpm install
```

## Run all apps

```sh
pnpm dev
```

## Build all packages

```sh
pnpm build
```

## Test

```sh
pnpm test
```