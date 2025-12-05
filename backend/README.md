# Synapse Backend

Node.js/Express backend server for Synapse - Real-Time Collaborative AI Workspace.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-Time**: Socket.io v4
- **Database**: MongoDB (Mongoose)
- **AI**: Google Gemini API

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# MongoDB - Get your connection string from https://www.mongodb.com/atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/synapse?retryWrites=true&w=majority

# Gemini API - Get your key from https://aistudio.google.com/app/apikey  
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port
PORT=3001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080
```

### 3. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/health` | GET | Health check with MongoDB status |

## WebSocket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ roomId, username }` | Join a room |
| `leave-room` | `{ roomId }` | Leave current room |
| `send-message` | `{ roomId, content }` | Send a chat message |
| `document-change` | `{ roomId, content }` | Update shared document |
| `typing-start` | `{ roomId }` | Indicate user started typing |
| `typing-stop` | `{ roomId }` | Indicate user stopped typing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-joined` | `{ room, messages, users }` | Room data after joining |
| `user-joined` | `{ user }` | New user joined room |
| `user-left` | `{ userId }` | User left room |
| `new-message` | `Message` | New message in chat |
| `ai-stream` | `{ messageId, token }` | AI response token |
| `ai-stream-end` | `{ messageId }` | AI finished streaming |
| `document-updated` | `{ content, userId }` | Document content changed |
| `user-typing` | `{ userId, isTyping }` | User typing status |

## AI Commands

In the chat, prefix your message with `/ai ` to invoke the AI:

```
/ai Summarize the document
/ai Write a haiku about collaboration
/ai Fix the grammar in the document
```

The AI has access to the current document content as context.

## Database Schema

### Room
```javascript
{
  id: String,          // Unique room ID
  name: String,        // Room name
  documentContent: String, // Shared document content
  createdAt: Date,
  updatedAt: Date
}
```

### Message
```javascript
{
  id: String,          // Unique message ID
  roomId: String,      // Room reference
  userId: String,      // User's socket ID
  username: String,    // Display name
  content: String,     // Message content
  isAI: Boolean,       // Is AI response
  timestamp: Date
}
```

## Frontend Connection

Make sure your frontend connects to:
```
ws://localhost:3001
```

Or set `VITE_SOCKET_URL` in the frontend to point to your backend URL.

## Troubleshooting

**MongoDB Connection Failed**
- Ensure your IP is whitelisted in MongoDB Atlas
- Check connection string format
- Verify credentials

**AI Not Responding**  
- Verify GEMINI_API_KEY is set correctly
- Check API quota/limits at https://aistudio.google.com

**CORS Errors**
- Update FRONTEND_URL in .env to match your frontend origin
- Ensure both HTTP and WS use same port
