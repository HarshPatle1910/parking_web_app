# System Architecture

## Overview

The Parking Management Web Application is a full-stack system designed for shop owners to manage paid vehicle parking using automated number plate recognition. The system provides real-time monitoring, automated charge calculation, and receipt delivery via WhatsApp.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Dashboard  │  │   Login/Reg  │  │   CCTV View  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                                │
│                    HTTP/REST + Socket.IO                    │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│          Node.js + Express Backend (Port 3001)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  REST API Layer                                      │  │
│  │  - /api/auth (register, login)                      │  │
│  │  - /api/parking (entry, exit, charge, dashboard)   │  │
│  │  - /api/settings (get, update)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Socket.IO Server                                    │  │
│  │  - Real-time vehicle entry/exit notifications      │  │
│  │  - Owner room-based updates                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service Layer                                       │  │
│  │  - ParkingService (business logic)                  │  │
│  │  - WhatsAppService (messaging)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────────┐
│   PostgreSQL   │  │   WhatsApp API  │  │   HLS Stream    │
│   (Prisma)     │  │  (Twilio/Meta)  │  │   (FFmpeg)      │
└────────────────┘  └─────────────────┘  └─────────────────┘
```

## Component Breakdown

### Frontend (React + TypeScript)

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Socket.IO Client for real-time updates
- Recharts for data visualization
- React Player for HLS video streaming

**Key Components:**
1. **Authentication**
   - Login/Register pages
   - JWT token management
   - Protected routes

2. **Dashboard**
   - Real-time statistics cards
   - Earnings chart (last 7 days)
   - Live CCTV feed (HLS)
   - Recent vehicle sessions table
   - Vehicle search functionality

3. **Real-time Updates**
   - Socket.IO integration
   - Automatic dashboard refresh on vehicle entry/exit

### Backend (Node.js + Express + TypeScript)

**Technology Stack:**
- Express.js for REST API
- TypeScript for type safety
- Prisma ORM for database access
- Socket.IO for WebSocket communication
- JWT for authentication
- Winston for logging
- Zod for validation

**Architecture Layers:**

1. **Routes Layer** (`src/routes/`)
   - Define API endpoints
   - Apply authentication middleware
   - Route requests to controllers

2. **Controller Layer** (`src/controllers/`)
   - Handle HTTP requests/responses
   - Input validation
   - Call service layer
   - Error handling

3. **Service Layer** (`src/services/`)
   - Business logic
   - Database operations
   - External API integrations
   - Complex calculations

4. **Middleware** (`src/middleware/`)
   - Authentication (JWT verification)
   - Error handling
   - Request logging

5. **Utilities** (`src/utils/`)
   - Logger configuration
   - Validation schemas
   - Helper functions

### Database Schema (PostgreSQL + Prisma)

**Models:**

1. **Owner**
   - Shop owner account information
   - Authentication credentials
   - One-to-many with ParkingSession

2. **ParkingSettings**
   - Per-owner configuration
   - Hourly rate, currency
   - Auto-calculation settings
   - WhatsApp configuration

3. **ParkingSession**
   - Vehicle entry/exit records
   - Duration and charge calculation
   - Receipt status
   - Indexed for performance

4. **VehicleHistory**
   - Aggregated vehicle statistics
   - Total visits, spending
   - Last visit tracking

5. **SystemLog**
   - Application logs
   - Audit trail
   - Error tracking

### Real-time Communication (Socket.IO)

**Events:**

- **Client → Server:**
  - `join-owner-room`: Owner subscribes to updates
  - `vehicle-entry`: Test vehicle entry (optional)
  - `vehicle-exit`: Test vehicle exit (optional)

- **Server → Client:**
  - `vehicle-entered`: Real-time entry notification
  - `vehicle-exited`: Real-time exit notification

**Room-based Updates:**
- Each owner has a dedicated room: `owner:{ownerId}`
- Updates are broadcast only to the relevant owner

### External Integrations

1. **WhatsApp Messaging**
   - Supports Twilio WhatsApp API
   - Supports Meta WhatsApp Cloud API
   - Fallback to logging in development
   - Receipt formatting with vehicle details

2. **Number Plate Recognition**
   - API-ready design
   - Accepts vehicle number, image URL, timestamp
   - Entry and exit endpoints
   - Image storage for audit

3. **CCTV Streaming**
   - HLS (HTTP Live Streaming) support
   - RTSP → HLS conversion via FFmpeg
   - React Player for playback
   - Configurable stream URL

## Data Flow

### Vehicle Entry Flow

1. Number plate recognition system captures vehicle
2. Recognition system calls `POST /api/parking/entry`
3. Backend creates ParkingSession with status "active"
4. Backend updates VehicleHistory
5. Socket.IO emits `vehicle-entered` to owner's room
6. Frontend receives update and refreshes dashboard

### Vehicle Exit Flow

1. Number plate recognition system captures vehicle
2. Recognition system calls `POST /api/parking/exit`
3. Backend finds active session
4. Backend calculates duration and charge (if auto-calculate enabled)
5. Backend updates session status to "completed"
6. Socket.IO emits `vehicle-exited` to owner's room
7. Frontend receives update and refreshes dashboard

### Receipt Sending Flow

1. Owner clicks "Send Receipt" in dashboard
2. Frontend calls `POST /api/parking/send-receipt`
3. Backend retrieves session data
4. Backend formats WhatsApp message
5. Backend calls WhatsApp service (Twilio/Meta)
6. Backend updates session receipt status
7. Frontend shows success message

## Security Considerations

1. **Authentication:**
   - JWT tokens with expiration
   - Password hashing with bcrypt
   - Protected API routes

2. **Authorization:**
   - Owner can only access their own data
   - Session ownership validation
   - Settings ownership validation

3. **Input Validation:**
   - Zod schemas for all inputs
   - Type checking with TypeScript
   - SQL injection prevention via Prisma

4. **Error Handling:**
   - Centralized error handler
   - Detailed logging
   - No sensitive data in error messages

## Scalability Considerations

1. **Database:**
   - Indexed columns for fast queries
   - Efficient query patterns
   - Connection pooling ready

2. **Real-time:**
   - Room-based Socket.IO updates
   - Efficient event broadcasting
   - Connection management

3. **API:**
   - Stateless REST design
   - Horizontal scaling ready
   - Caching opportunities (future)

## Deployment Architecture

**Recommended Setup:**

- **Frontend:** Static hosting (Vercel, Netlify, AWS S3)
- **Backend:** Node.js hosting (Heroku, AWS EC2, DigitalOcean)
- **Database:** Managed PostgreSQL (AWS RDS, Heroku Postgres)
- **WebSocket:** Socket.IO with sticky sessions (Redis adapter)
- **Streaming:** Separate media server (nginx-rtmp, Wowza)

## Future Enhancements

1. Payment gateway integration
2. Multi-location support
3. Advanced analytics and reporting
4. Mobile app (React Native)
5. Email notifications
6. SMS fallback for WhatsApp
7. Admin panel for system management
8. API rate limiting
9. Redis caching layer
10. Background job processing (Bull/BullMQ)

