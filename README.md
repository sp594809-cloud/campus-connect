# Campus Connect 🎓

A simple, lightweight student community platform for sharing posts, interview experiences, selling items, and joining groups.

## Features

✅ **Student Accounts** - Simple email/password signup  
✅ **Posts** - Write and share posts with tags  
✅ **Interview Experiences** - Share company interview tips and questions  
✅ **Marketplace** - Buy and sell books, notes, electronics  
✅ **Groups** - Create and join study groups, clubs, etc  

## Tech Stack

- **Backend**: FastAPI + Python
- **Frontend**: React + TypeScript + Vite
- **Database**: MongoDB
- **Authentication**: JWT

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- MongoDB (local or cloud)

### 1. Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt

# Update .env with your MongoDB URL
echo "MONGO_URL=mongodb://localhost:27017" > .env

# Run server
python server.py
```

Server runs at `http://localhost:8000`

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## API Endpoints

### Authentication
```
POST   /api/auth/signup    - Create account
POST   /api/auth/login     - Login
```

### Posts
```
GET    /api/posts          - Get all posts
POST   /api/posts          - Create post
GET    /api/posts/{id}     - Get post
DELETE /api/posts/{id}     - Delete post
```

### Interview Experiences
```
GET    /api/interviews     - Get all
POST   /api/interviews     - Create
```

### Marketplace
```
GET    /api/marketplace/items    - Get items
POST   /api/marketplace/items    - List item
```

### Groups
```
GET    /api/groups         - Get all
POST   /api/groups         - Create group
POST   /api/groups/{id}/join - Join group
```

## Environment Variables

**Backend (.env)**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=campus_connect
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8000
```

## Database Collections

- `users` - Student accounts
- `posts` - User posts
- `interviews` - Interview experiences
- `marketplace` - Items for sale
- `groups` - Student groups

## Development

```bash
# Install dependencies
cd backend && pip install -r requirements.txt
cd frontend && npm install

# Run both
# Terminal 1: Backend
cd backend && python server.py

# Terminal 2: Frontend
cd frontend && npm run dev
```

## What Was Removed

❌ Roster database authentication  
❌ Complex company API integration  
❌ AI learning system (Claude)  
❌ Company news ticker  
❌ Karma system  
❌ Admin moderation  

These features can be added back later if needed.

## License

MIT
