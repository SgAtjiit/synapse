# ⚡ Synapse — Real-Time Collaborative AI Workspace

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/MongoDB-8.7-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Groq_AI-GPT--OSS--20B-F05032?style=for-the-badge&logo=groq&logoColor=white" alt="Groq AI" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/TipTap-Editor-000000?style=for-the-badge&logo=tiptap&logoColor=white" alt="TipTap" />
</p>

---

## 📌 Overview

**Synapse** is a modern, full-stack **Real-Time Collaborative AI Workspace**. It combines live multi-user rich text document editing with ultra-fast Large Language Model (LLM) intelligence powered exclusively by **Groq (`openai/gpt-oss-20b`)**.

Designed for team brainstorming, document drafting, and intelligent content creation, Synapse provides seamless synchronous collaboration over WebSockets while powering smart inline ghost text completions, AI document formatting, context-aware room chat, and instant file exporting to Word, PDF, or Plain Text.

---

## ✨ Key Features

### 👥 Real-Time Collaboration & Presence
* **Synchronous Multi-User Editing**: Powered by Socket.io, multiple team members can edit documents in the same room simultaneously without conflicts.
* **Live Presence Bar**: Visual user avatars with unique assigned user colors and real-time active user counts.
* **Typing Indicators**: Displays real-time status updates ("*Username is typing...*") when collaborators compose messages or edit documents.

### 🤖 AI-Powered Writing & Intelligence
* **Ghost Autocomplete**: Contextual inline text suggestions powered by Groq (`openai/gpt-oss-20b`). Press `Tab` to accept completions or `Esc` to dismiss.
* **Context-Aware AI Chat**: Integrated chat panel featuring the `/ai` command streaming answers directly into the chat while referencing current document context.
* **Smart AI Document Auto-Formatting**: Convert unstructured text or drafts into clean, styled, professional HTML structure using Groq-powered AI formatting.

### 📝 Rich Document Editing Engine
* **TipTap Rich-Text Suite**: Comprehensive formatting including Headings (H1–H6), Bold, Italic, Strikethrough, Code blocks, and Blockquotes.
* **Custom Typography & Alignment**: Adjust font family, font size, text colors, and paragraph alignments (Left, Center, Right).
* **Lists & Tables**: Support for bulleted lists, numbered lists, and interactive tables (rows, columns, header rows).
* **Resizable Images**: Insert and resize images dynamically within documents.
* **Word & Character Counter**: Live metrics displayed at the bottom of the editor.

### 📁 Workspace & History Management
* **Multi-Document Rooms**: Create, switch, and delete multiple documents within a single workspace room.
* **Workspace History**: Tracks visited collaboration rooms, message statistics, and last active timestamps for authenticated users via MongoDB.
* **Firebase Authentication**: Secure user login, registration, and guest access support via Firebase Auth.

### 📄 Export & Sharing Capabilities
* **Microsoft Word (.docx)**: Export documents with preserved formatting.
* **PDF Document (.pdf)**: Client-side PDF rendering using `html2pdf.js`.
* **Plain Text (.txt)**: Clean plain text document export.

---

## 🛠️ Architecture & Tech Stack

Synapse is architected as a decoupled full-stack monorepo:

### **Frontend**
* **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/)
* **Rich Text Engine**: [TipTap Editor](https://tiptap.dev/)
* **State & Real-Time**: [Socket.io Client](https://socket.io/), React Context API
* **Auth**: [Firebase Authentication](https://firebase.google.com/)
* **Export Utilities**: `html-docx-js-typescript`, `html2pdf.js`, `file-saver`

### **Backend**
* **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
* **Web Framework**: [Express.js](https://expressjs.com/)
* **Real-Time Engine**: [Socket.io](https://socket.io/) (v4)
* **Database**: [MongoDB](https://www.mongodb.com/) + [Mongoose ORM](https://mongoosejs.com/)
* **AI Provider**: [Groq Cloud SDK](https://groq.com/) (`@ai-sdk/groq` / Model: `openai/gpt-oss-20b`)

---

## 📁 Repository Structure

```
Synapse-main/
├── backend/                  # Node.js Express & Socket.io server
│   ├── controllers/          # HTTP request handlers (Autocomplete, History, Health)
│   ├── models/               # Mongoose Schemas (Room, Message, UserHistory)
│   ├── routes/               # Express API endpoints
│   ├── services/             # Socket.io event handling & Groq AI client integration
│   ├── utils/                # Helper utilities
│   ├── app.js                # Express app setup & CORS configuration
│   ├── server.js             # HTTP server & Socket.io initialization entry point
│   └── package.json
├── frontend/                 # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/       # UI components (DocumentEditor, Workspace, ChatPanel, PresenceBar)
│   │   ├── contexts/         # React AuthContext
│   │   ├── extensions/       # Custom TipTap Extensions (AutoComplete, FontSize, ResizableImage)
│   │   ├── hooks/            # Custom React hooks (useSocket, useToast)
│   │   ├── lib/              # Firebase & utility configs
│   │   ├── pages/            # App pages (Auth, Workspace, History, NotFound)
│   │   └── types/            # TypeScript interface definitions
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
└── README.md                 # Root documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* **Node.js**: v18.0.0 or higher
* **npm** or **bun** / **yarn**
* **MongoDB**: A local instance or a free [MongoDB Atlas Cluster](https://www.mongodb.com/atlas)
* **Groq API Key**: Free API key from [Console Groq](https://console.groq.com/)
* **Firebase Account Config**: Configured via [Firebase Console](https://console.firebase.google.com/) for user authentication

---

### 📥 Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/synapse.git
cd synapse
```

#### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:
```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:8080

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/synapse?retryWrites=true&w=majority

# Groq AI Credentials (Free Model)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL_NAME=openai/gpt-oss-20b
```

Start the backend server in development mode:
```bash
npm run dev
```
*(Server will start on `http://localhost:3001` and WebSocket server at `ws://localhost:3001`)*

---

#### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend/` directory (refer to `.env.example`):
```env
# Backend API & WebSocket URLs
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Start the frontend development server:
```bash
npm run dev
```
*(Application preview will be available at `http://localhost:8080` or `http://localhost:5173`)*

---

## 📡 API & WebSocket Specification

### REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check & MongoDB connectivity status |
| `POST` | `/api/autocomplete` | Fetches inline AI text completions based on current cursor context |
| `GET` | `/api/history/:firebaseUid` | Fetches room visit history & message stats for a user |
| `GET` | `/api/room/:roomId` | Retrieves room details, active documents, and chat history |

---

### WebSocket Events (`Socket.io`)

#### Client ➡️ Server
| Event | Payload | Description |
| :--- | :--- | :--- |
| `join-room` | `{ roomId, username, firebaseUid }` | Connect user to a collaboration room |
| `leave-room` | `{ roomId }` | Disconnect user from active room |
| `send-message` | `{ roomId, content }` | Send chat message (Triggers `/ai` command if prefixed) |
| `document-change` | `{ roomId, documentId, content }` | Broadcast real-time document modifications |
| `create-document` | `{ roomId, title }` | Add a new sub-document to current room |
| `delete-document` | `{ roomId, documentId }` | Remove document from room |
| `ai-format-document` | `{ roomId, documentId, content }` | Trigger AI document re-formatting |
| `typing-start` | `{ roomId }` | Broadcast typing status |
| `typing-stop` | `{ roomId }` | Stop typing broadcast |

#### Server ➡️ Client
| Event | Payload | Description |
| :--- | :--- | :--- |
| `room-joined` | `{ room, messages, users }` | Delivers room document state & chat history upon join |
| `user-joined` | `{ user }` | Notifies room members of a new participant |
| `user-left` | `{ userId }` | Notifies room members when a user leaves |
| `new-message` | `Message` | Broadcasts new chat message |
| `ai-stream` | `{ messageId, token }` | Streams live tokens from Groq AI response |
| `ai-stream-end` | `{ messageId }` | Signals end of AI response stream |
| `document-updated` | `{ documentId, content, userId }` | Syncs updated document state to collaborators |
| `document-created` | `Document` | Notifies room of newly created document |
| `document-deleted` | `{ documentId }` | Notifies room of deleted document |
| `user-typing` | `{ userId, isTyping }` | Live typing indicator updates |

---

## 🤖 Using AI Capabilities

1. **Inline Autocomplete**:
   * As you type in the editor, pause briefly. Synapse will fetch a light ghost completion (gray text) from Groq.
   * Press `Tab` to accept the suggestion into your document.
   * Press `Esc` to clear the suggestion.

2. **AI Room Assistant Chat**:
   * Open the Chat Drawer on the right.
   * Type `/ai <your question or task>` (e.g., `/ai Summarize this document into bullet points`).
   * Synapse AI reads the document context and streams the response directly in chat using Groq (`openai/gpt-oss-20b`).

3. **AI Document Auto-Formatting**:
   * Click the **AI Format** button in the document toolbar.
   * The server will clean up your raw text and format it into clean HTML structure with headers, lists, and emphasis via Groq.

---

## 🛡️ License

This project is open-source and available under the [MIT License](LICENSE).
