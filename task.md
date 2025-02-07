# Task: Implement Filtering UI for Past Year Papers

## Background

Currently, our PaperList component displays a simple list of past year papers. We need to add filtering capabilities to help users find specific papers more easily. The final UI should look very similar to the UI here: https://grail.moe/library.

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/teebloc/pyps.git
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

Before starting the development server, you will need to create a .env file in the root directory with the following environment variable:

```bash
HASURA_ADMIN_SECRET=your_hasura_admin_secret
```

You can ask Young Jin for the HASURA_ADMIN_SECRET.

## Technical Context

This website is primarily built using Astro, a modern static site generator. However, for interactive components like filtering, we use React components within Astro pages. This hybrid approach allows us to maintain fast page loads while adding dynamic features where needed. This is why most of the files use the .astro extension, but only PaperList.tsx uses the .tsx extension (React).

## Requirements

### 1. Implementation

Modify the existing `PaperList` component in `src/components/PaperList.tsx` to implement the filter functionality. Add more React components if you would like.

### 2. Filter Criteria

The filter should handle all of these fields:

- School
- Subject
- Level
- Year
- Type

Users should be able to filter by any combination of these criteria.
