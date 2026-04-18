<!--
Sync Impact Report:
Version change: [ALL_CAPS_TOKEN] -> 1.0.0
List of modified principles:
  - [PRINCIPLE_1_NAME] -> I. Aesthetic-Driven UX
  - [PRINCIPLE_2_NAME] -> II. Community-Led Contributions
  - [PRINCIPLE_3_NAME] -> III. Data-First Architecture (NON-NEGOTIABLE)
  - [PRINCIPLE_4_NAME] -> IV. Modern Tech Stack (Next.js 16 + React 19)
  - [PRINCIPLE_5_NAME] -> V. Automated Validation & Sync
Added sections:
  - Technology Stack & Constraints
  - Contribution & Review Workflow
Removed sections:
  - None
Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated - reviewed for alignment)
  - .specify/templates/spec-template.md (✅ updated - reviewed for alignment)
  - .specify/templates/tasks-template.md (✅ updated - reviewed for alignment)
Follow-up TODOs:
  - None
-->

# Prompt Gallery Constitution

## Core Principles

### I. Aesthetic-Driven UX
The gallery must prioritize high-fidelity visuals (cyber-obsidian style, glassmorphism) and immersive experiences (video hover previews, Framer Motion animations). Every UI element must contribute to the "minimalist yet premium" aesthetic.

### II. Community-Led Contributions
Enable easy contributions via both web-based (GitHub App) and local (Markdown/JSON) workflows. Automation (GitHub Actions) handles data synchronization and PR management to ensure a low barrier to entry for creators.

### III. Data-First Architecture (NON-NEGOTIABLE)
All prompt data and visual assets are managed via local Markdown files (Frontmatter) and JSON. Any database-like behavior must be backed by file-system synchronization (`npm run sync`). The codebase remains portable and git-centric.

### IV. Modern Tech Stack (Next.js 16 + React 19)
Use the latest App Router patterns, TailwindCSS v4, and TypeScript. All components must be type-safe and adhere to the project's minimalist design philosophy. No outdated libraries or "quick hacks" that bypass the type system.

### V. Automated Validation & Sync
Every contribution must pass automated checks (Linting, Sync script). The `scripts/sync.ts` is the source of truth for generating the gallery's static data. Manual data entry into JSON files is discouraged; use the sync script instead.

## Technology Stack & Constraints

Framework: Next.js 16.2.4 (App Router). Styling: TailwindCSS 4.0. Runtime: Node.js 20+. Package Manager: npm. Type System: Strict TypeScript. All assets must be stored in `public/data/`.

## Contribution & Review Workflow

Web submissions trigger automated PRs via GitHub App. Local submissions require `npm run sync` before PR creation. Code reviews must verify adherence to the cyber-obsidian aesthetic and ensure proper metadata in `index.md`.

## Governance

The constitution supersedes any ad-hoc design decisions. All PRs must comply with the Aesthetic-Driven UX principle. Complexity must be justified against the "minimalist" goal. Amendments require consensus and an update to this document.

**Version**: 1.0.0 | **Ratified**: 2026-04-18 | **Last Amended**: 2026-04-18
