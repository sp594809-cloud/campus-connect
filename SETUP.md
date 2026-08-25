# Campus Connect - Complete Setup Guide

## Install MongoDB

### Option 1: Local MongoDB (Recommended for Development)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download from https://www.mongodb.com/try/download/community
Run installer and follow prompts

**Linux:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install mongodb-org
sudo systemctl start mongod
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Add to `.env`:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/campus_connect?retryWrites=true&w=majority
   ```

## Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=campus_connect
SECRET_KEY=change-this-in-production-12345
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
EOF

# Run server
python server.py
```

✅ Server at http://localhost:8000

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env.local << EOF
VITE_API_URL=http://localhost:8000
EOF

# Run dev server
npm run dev
```

✅ Frontend at http://localhost:5173

## Test the API

### 1. Create Account
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@college.edu",
    "password": "password123",
    "full_name": "John Doe",
    "college": "MIT"
  }'
```

### 2. Create a Post
```bash
curl -X POST http://localhost:8000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tips for Java",
    "content": "Here are some tips...",
    "tags": ["java", "programming"]
  }'
```

### 3. Share Interview Experience
```bash
curl -X POST http://localhost:8000/api/interviews \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Google",
    "position": "Software Engineer",
    "experience": "Great experience...",
    "difficulty": "hard",
    "questions": ["What is OOP?"],
    "tips": "Practice DSA"
  }'
```

### 4. List an Item
```bash
curl -X POST http://localhost:8000/api/marketplace/items \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Data Structures Book",
    "description": "Like new condition",
    "price": 25.00,
    "category": "books",
    "images": []
  }'
```

### 5. Create a Group
```bash
curl -X POST http://localhost:8000/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "JavaScript Learners",
    "description": "Learn JS together",
    "category": "study"
  }'
```

## Troubleshooting

### MongoDB Connection Failed
- Check MongoDB is running: `mongosh` (should connect)
- Verify MONGO_URL in .env
- Check firewall if using MongoDB Atlas

### Frontend won't connect to API
- Check VITE_API_URL in frontend/.env.local
- Check backend is running: http://localhost:8000/api/health
- Check CORS settings in backend .env

### Port already in use
```bash
# Change port in server.py
uvicorn.run(app, host="0.0.0.0", port=8001)

# Or kill existing process
lsof -ti:8000 | xargs kill -9  # macOS/Linux
taskkill /PID <pid> /F  # Windows
```

## Next Steps

1. ✅ Start both backend and frontend
2. ✅ Visit http://localhost:5173
3. ✅ Create an account
4. ✅ Create your first post
5. ✅ Share an interview experience
6. ✅ Start a group

That's it! You now have a working Campus Connect instance.
