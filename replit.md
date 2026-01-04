# Unified Jukebox - System Architecture

## Overview

The Unified Jukebox is a web-based music management system designed for commercial venues such as bars, restaurants, and entertainment spaces. It provides a unified interface for customers to search and queue music from multiple streaming services (Spotify, YouTube, Apple Music) while giving venue staff complete control over playback and content management.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite for bundling
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSockets for live updates
- **UI Framework**: Radix UI components with Tailwind CSS
- **State Management**: TanStack Query for server state management

### Database Configuration
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Migrations**: Managed through Drizzle Kit
- **Schema Location**: `shared/schema.ts`

## Key Components

### 1. Frontend Architecture

**Client Structure**:
- `client/src/pages/` - Route components (Customer interface, Admin dashboard)
- `client/src/components/` - Reusable UI components
- `client/src/lib/` - Utility functions and API client
- `client/src/hooks/` - Custom React hooks

**Key Features**:
- Touch-optimized customer interface with retro-futuristic design
- Admin dashboard for queue management and venue settings
- Real-time WebSocket integration for live updates
- Responsive design with mobile-first approach

### 2. Backend Architecture

**Server Structure**:
- `server/index.ts` - Main server entry point
- `server/routes.ts` - API route definitions
- `server/services/` - Business logic layer
- `server/storage.ts` - Data access layer abstraction

**Service Layer**:
- Queue Management Service (`queue-manager.ts`)
- Spotify MCP Service (`spotify-mcp.ts`)
- YouTube MCP Service (`youtube-mcp.ts`)
- Apple Music MCP Service (`apple-music-mcp.ts`)

### 3. Data Storage Solutions

**Database Schema**:
- `tracks` table: Stores queued music tracks with metadata
- `venue_settings` table: Manages service configurations and authentication

**Storage Interface**:
- Abstract storage interface with in-memory implementation
- Prepared for PostgreSQL integration through Drizzle ORM
- Track lifecycle management (pending, playing, played, skipped)

### 4. Authentication and Authorization

**Current State**:
- Basic venue-level access control
- Service-specific authentication tokens stored in venue settings
- Admin interface protected by route-level access

**Future Considerations**:
- OAuth integration with music services
- Customer session management
- Role-based access control

## Data Flow

### Customer Journey
1. Customer accesses touch interface (`/customer`)
2. Searches across all configured music services
3. Selects track to add to queue
4. Real-time updates show queue position
5. WebSocket notifications for queue changes

### Admin Management
1. Admin accesses dashboard (`/admin`)
2. Monitors live queue and playback status
3. Controls playback (play, pause, skip)
4. Manages service configurations
5. Real-time synchronization with customer interface

### Music Service Integration
1. Unified search API aggregates results from all services
2. MCP (Music Control Protocol) services handle platform-specific APIs
3. Queue manager coordinates playback across services
4. WebSocket broadcasts maintain real-time state

## External Dependencies

### Core Dependencies
- **React Query**: Server state management and caching
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Wouter**: Lightweight client-side routing
- **WebSocket**: Real-time communication

### Music Service APIs
- **Spotify API**: Track search and playback control
- **YouTube API**: Video search and metadata
- **Apple Music API**: Catalog search and integration

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and developer experience
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Development Environment
- Vite dev server with hot module replacement
- Express server with middleware integration
- In-memory storage for rapid prototyping

### Production Considerations
- Static asset serving through Express
- PostgreSQL database connection via Neon
- Environment-based configuration management
- WebSocket scaling for multiple concurrent users

### Build Process
1. Frontend assets built with Vite
2. Backend compiled with esbuild
3. Single deployment artifact with Express serving static files
4. Database migrations handled through Drizzle Kit

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
- July 05, 2025. Added PostgreSQL database integration with Drizzle ORM
- July 05, 2025. Enhanced MCP services with proper authentication flows and API integration
- July 05, 2025. Added unified search ranking and MCP service management system
- July 05, 2025. Added service status monitoring in admin dashboard
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```