# Setup Guide

This guide will help you set up and run the Parking Management Web Application.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Step 1: Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE parking_db;
```

2. Update the `DATABASE_URL` in `backend/.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/parking_db?schema=public"
```

## Step 2: Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example file:
```bash
cp env.example .env
```

4. Update `.env` with your configuration:
   - Database URL
   - JWT Secret (generate a strong random string)
   - WhatsApp credentials (Twilio or Meta)
   - HLS stream URL (if you have a camera stream)

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

7. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

## Step 3: Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example file:
```bash
cp env.example .env
```

4. Update `.env` if needed (defaults should work for local development):
```
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
VITE_HLS_STREAM_URL=http://localhost:8080/hls/stream.m3u8
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Step 4: Initial Setup

1. Open `http://localhost:3000` in your browser
2. Register a new owner account
3. Login with your credentials
4. Configure parking settings (hourly rate, WhatsApp number, etc.)

## Step 5: Number Plate Recognition Integration

The system is designed to accept number plate recognition data via API calls. Your recognition system should:

1. Call `POST /api/parking/entry` when a vehicle enters
2. Call `POST /api/parking/exit` when a vehicle exits

See `API_DOCUMENTATION.md` for detailed API specifications.

## Step 6: CCTV Streaming (Optional)

To set up HLS streaming from an IP camera:

1. Install FFmpeg
2. Convert RTSP stream to HLS:
```bash
ffmpeg -i rtsp://camera-ip:port/stream -c:v copy -c:a copy -f hls -hls_time 2 -hls_list_size 3 -hls_flags delete_segments /path/to/hls/stream.m3u8
```

3. Serve the HLS files via a web server (nginx, Apache, or Node.js)
4. Update `HLS_STREAM_URL` in backend `.env`

## Step 7: WhatsApp Integration

### Option 1: Twilio

1. Sign up for Twilio account
2. Get Account SID and Auth Token
3. Enable WhatsApp Sandbox or use Twilio WhatsApp API
4. Update backend `.env`:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Option 2: Meta WhatsApp Cloud API

1. Create a Meta Business account
2. Set up WhatsApp Business API
3. Get Access Token and Phone Number ID
4. Update backend `.env`:
```
META_WHATSAPP_ACCESS_TOKEN=your_access_token
META_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

## Production Deployment

### Backend

1. Build the TypeScript code:
```bash
npm run build
```

2. Set `NODE_ENV=production` in `.env`

3. Use a process manager like PM2:
```bash
pm2 start dist/server.js --name parking-backend
```

### Frontend

1. Build for production:
```bash
npm run build
```

2. Serve the `dist` folder using nginx or any static file server

### Database

- Use a managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)
- Ensure proper backups are configured
- Use connection pooling in production

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Socket.IO Connection Issues

- Check CORS settings in backend
- Verify `FRONTEND_URL` matches your frontend URL
- Check firewall settings

### WhatsApp Not Sending

- Verify credentials are correct
- Check Twilio/Meta account status
- Review logs in `backend/logs/` directory

## Support

For issues or questions, check the logs in `backend/logs/` directory.

