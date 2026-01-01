# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register Owner
**POST** `/auth/register`

Register a new shop owner account.

**Request Body:**
```json
{
  "email": "owner@example.com",
  "password": "password123",
  "name": "John Doe",
  "shopName": "Downtown Parking",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "owner": {
      "id": "uuid",
      "email": "owner@example.com",
      "name": "John Doe",
      "shopName": "Downtown Parking"
    },
    "token": "jwt_token_here"
  },
  "message": "Owner registered successfully"
}
```

---

### Login
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "owner": {
      "id": "uuid",
      "email": "owner@example.com",
      "name": "John Doe",
      "shopName": "Downtown Parking"
    },
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}
```

---

## Parking Endpoints

### Record Vehicle Entry
**POST** `/parking/entry`

Record a vehicle entering the parking area. This endpoint is typically called by the number plate recognition system.

**Request Body:**
```json
{
  "vehicleNumber": "ABC123",
  "imageUrl": "https://example.com/images/entry-abc123.jpg",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "ownerId": "owner-uuid",
    "vehicleNumber": "ABC123",
    "entryTime": "2024-01-15T10:30:00Z",
    "entryImageUrl": "https://example.com/images/entry-abc123.jpg",
    "status": "active"
  },
  "message": "Vehicle entry recorded successfully"
}
```

---

### Record Vehicle Exit
**POST** `/parking/exit`

Record a vehicle exiting the parking area.

**Request Body:**
```json
{
  "vehicleNumber": "ABC123",
  "imageUrl": "https://example.com/images/exit-abc123.jpg",
  "timestamp": "2024-01-15T14:45:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "ownerId": "owner-uuid",
    "vehicleNumber": "ABC123",
    "entryTime": "2024-01-15T10:30:00Z",
    "exitTime": "2024-01-15T14:45:00Z",
    "durationMinutes": 255,
    "amount": 25.00,
    "status": "completed"
  },
  "message": "Vehicle exit recorded successfully"
}
```

---

### Calculate/Override Charge
**POST** `/parking/calculate-charge`

Calculate parking charge automatically or set a manual amount.

**Request Body (Auto-calculate):**
```json
{
  "sessionId": "session-uuid"
}
```

**Request Body (Manual override):**
```json
{
  "sessionId": "session-uuid",
  "amount": 30.00
}
```

**Request Body (Override hourly rate):**
```json
{
  "sessionId": "session-uuid",
  "hourlyRate": 10.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "amount": 30.00,
    "amountType": "manual"
  },
  "message": "Charge calculated successfully"
}
```

---

### Send Receipt
**POST** `/parking/send-receipt`

Send parking receipt via WhatsApp.

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "recipientPhone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Receipt sent successfully"
}
```

---

### Get Dashboard Statistics
**GET** `/parking/dashboard`

Get dashboard statistics including earnings, active vehicles, and recent sessions.

**Response:**
```json
{
  "success": true,
  "data": {
    "todayEarnings": 1250.50,
    "activeVehicles": 5,
    "totalSessions": 42,
    "averageDuration": 120,
    "recentSessions": [
      {
        "id": "session-uuid",
        "vehicleNumber": "ABC123",
        "entryTime": "2024-01-15T10:30:00Z",
        "exitTime": "2024-01-15T14:45:00Z",
        "durationMinutes": 255,
        "amount": 25.00,
        "status": "completed",
        "receiptSent": true
      }
    ],
    "earningsChart": [
      {
        "date": "2024-01-09",
        "amount": 850.00
      },
      {
        "date": "2024-01-10",
        "amount": 920.50
      }
    ]
  }
}
```

---

### Search Vehicles
**GET** `/parking/search?q=ABC123`

Search for vehicles by number plate.

**Query Parameters:**
- `q` (required): Search query (vehicle number)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session-uuid",
      "vehicleNumber": "ABC123",
      "entryTime": "2024-01-15T10:30:00Z",
      "exitTime": "2024-01-15T14:45:00Z",
      "durationMinutes": 255,
      "amount": 25.00,
      "status": "completed"
    }
  ]
}
```

---

## Socket.IO Events

### Client → Server

#### Join Owner Room
```javascript
socket.emit('join-owner-room', ownerId);
```

#### Vehicle Entry (for testing)
```javascript
socket.emit('vehicle-entry', {
  ownerId: 'owner-uuid',
  vehicleNumber: 'ABC123'
});
```

#### Vehicle Exit (for testing)
```javascript
socket.emit('vehicle-exit', {
  ownerId: 'owner-uuid',
  vehicleNumber: 'ABC123'
});
```

### Server → Client

#### Vehicle Entered
```javascript
socket.on('vehicle-entered', (data) => {
  console.log(data);
  // { vehicleNumber: 'ABC123', timestamp: '2024-01-15T10:30:00Z' }
});
```

#### Vehicle Exited
```javascript
socket.on('vehicle-exited', (data) => {
  console.log(data);
  // { vehicleNumber: 'ABC123', timestamp: '2024-01-15T14:45:00Z' }
});
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Status Codes:**
- `400` - Bad Request (validation errors, etc.)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (invalid token)
- `500` - Internal Server Error

---

## Number Plate Recognition Integration

The system expects number plate recognition to call the entry/exit endpoints:

1. **Vehicle Entry:**
   - Recognition system captures plate → calls `/api/parking/entry`
   - System creates active session
   - Real-time update sent via Socket.IO

2. **Vehicle Exit:**
   - Recognition system captures plate → calls `/api/parking/exit`
   - System calculates duration and charge
   - Real-time update sent via Socket.IO

**Example Integration:**
```javascript
// When vehicle enters
await fetch('http://localhost:3001/api/parking/entry', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    vehicleNumber: 'ABC123',
    imageUrl: 'https://storage.example.com/entry-abc123.jpg',
    timestamp: new Date().toISOString()
  })
});
```

