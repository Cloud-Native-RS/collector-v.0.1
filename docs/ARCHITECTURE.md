# Architecture Documentation

## Project Structure

This project follows a modern Next.js 14+ app router architecture with feature-based organization.

### Root Structure

```
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Public auth routes (login, signup, forgot-password)
│   ├── collector/                # Main app section (protected routes)
│   │   └── dashboard/            # Dashboard feature
│   └── dashboard/                # Legacy dashboard routes
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── layout/                   # Layout components (header, sidebar, etc.)
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utilities and helpers
│   ├── auth/                     # Auth utilities
│   └── utils.ts                  # General utilities
├── middleware.ts                 # Next.js middleware for route protection
└── docs/                         # Documentation
```

## Authentication Flow

### Public Routes

Located in `app/(auth)/`:
- `/(auth)/login` - User login page
- `/(auth)/signup` - User registration page
- `/(auth)/forgot-password` - Password reset page

### Protected Routes

Located in `app/collector/`:
- `/collector/dashboard` - Main dashboard (requires authentication)

### Authentication Components

Located in `components/auth/`:
- `login-form.tsx` - Login form component
- `signup-form.tsx` - Registration form component

### Auth Utilities

Located in `lib/auth/utils.ts`:
- `login()` - Handle user login
- `signup()` - Handle user registration
- `validateEmail()` - Email validation
- `validatePassword()` - Password strength validation

## Middleware

The middleware (`middleware.ts`) handles:
1. Redirecting root path (`/`) to `/collector/dashboard`
2. Redirecting legacy routes (`/login`, `/signup`) to new auth routes
3. Future: Protecting routes that require authentication

## Component Organization

### Feature-Based Structure

Each major feature has its own folder in `app/`:
- `app/collector/dashboard/` - Dashboard feature with its components

### Shared Components

- `components/ui/` - Reusable UI components (shadcn/ui)
- `components/layout/` - Layout components (header, sidebar, etc.)
- `components/auth/` - Authentication-related components

## Best Practices

1. **Routing**: Use Next.js 13+ app router conventions
2. **Components**: Keep components small and focused
3. **State Management**: Use React hooks and context for state
4. **API**: Place server actions and API routes in feature folders
5. **Types**: Use TypeScript for type safety
6. **Validation**: Validate user input on both client and server
7. **Security**: Store sensitive data securely, never in localStorage in production

## Future Improvements

- [ ] Implement proper session management (use NextAuth.js or similar)
- [ ] Add route protection middleware
- [ ] Implement social login (Apple, Google)
- [ ] Add password reset functionality
- [ ] Add email verification
- [ ] Add rate limiting for auth endpoints
- [ ] Add CSRF protection

