# Todo Frontend

Vue.js frontend for the Todo API application.

## Tech Stack

- Vue 3 with Composition API
- TypeScript
- TanStack Query (Vue Query)
- Pinia for state management
- Vue Router
- shadcn-vue + Tailwind CSS
- Vite

## Development

```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Run tests
bun test

# Build for production
bun run build
```

## Environment Variables

Create `.env` file:

```bash
VITE_API_URL=http://localhost:3000
```

## Features

- JWT authentication (login/register)
- Create, read, update, delete todos
- Toggle complete with optimistic updates
- Priority levels (low, medium, high)
- Due date tracking
- Responsive design with shadcn-vue components
