# Snake Game Application

A full-stack horror-themed snake game with user authentication and virtual currency system.

## 🎮 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Horror Theme**: Dark, creepy UI with glowing effects and eerie animations
- **Snake Game**: Smooth, polished gameplay with keyboard controls
- **Virtual Currency**: Starting balance of $1,000,000 for future gambling features
- **Game History**: Track and save your game sessions
- **Leaderboard**: Compete with other players

## 🏗️ Architecture

The project follows a clean MVC architecture with separated concerns:

```
gamb_/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth middleware
│   │   └── __tests__/      # Unit tests
│   └── prisma/       # Database schema
│
└── frontend/         # React application
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── pages/          # Page components
    │   ├── contexts/       # React contexts
    │   ├── api/            # API client
    │   └── styles/         # CSS styles
    └── e2e/          # E2E tests
```

## 🚀 Quick Start

**The easiest way to run the application:**

```bash
# From the project root directory
./start.sh
```

This script will:
- Start both backend and frontend servers
- Automatically open the application in your browser
- Handle cleanup when you press Ctrl+C

**Alternative using npm:**

```bash
npm start
```

> **Note**: Make sure PostgreSQL is running and you've set up the database (see Full Setup below)

---

## 🔧 Full Setup Guide

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### One-Time Setup

If this is your first time running the application, follow these steps:

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and update DATABASE_URL with your PostgreSQL credentials
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

**After initial setup, you can use the quick start script from the project root:**
```bash
cd ..
./start.sh
```

Or manually start servers:

6. Start the backend development server:
```bash
npm run dev
```

The API will be running at `http://localhost:3000`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be running at `http://localhost:5173`

## 🧪 Testing

### Backend Tests

Run unit tests:
```bash
cd backend
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

### Frontend Tests

Run unit tests:
```bash
cd frontend
npm test
```

Run E2E tests:
```bash
npm run test:e2e
```

Run E2E tests with UI:
```bash
npm run test:e2e:ui
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

### User
- `GET /api/user/profile` - Get user profile (protected)
- `GET /api/user/game-history` - Get game history (protected)

### Game
- `POST /api/game/save-session` - Save game session (protected)
- `GET /api/game/leaderboard` - Get top scores

## 🎮 Game Controls

- **Arrow Keys** or **WASD**: Move the snake
- **Space**: Pause/Resume game
- **R**: Restart game (when game over)

## 🎨 Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL + Prisma ORM
- JWT for authentication
- bcrypt for password hashing
- Jest for testing

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios
- Vitest for unit tests
- Playwright for E2E tests

## 📝 Database Schema

### User
- id (UUID)
- username (unique)
- email (unique)
- password (hashed)
- bankBalance (default: 1,000,000)
- createdAt
- updatedAt

### GameSession
- id (UUID)
- userId (foreign key)
- score
- duration (seconds)
- completedAt

## 🔐 Security

- Passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- Protected routes require valid tokens
- CORS configured for frontend origin
- Input validation on all endpoints

## 🎨 Horror Theme

The application features a dark, horror-themed UI with:
- Deep blacks and dark reds
- Toxic green accents
- Creepy fonts (Creepster, Nosifer)
- Glowing effects and shadows
- Smooth animations
- Eerie color palette

## 📦 Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🔮 Future Features

- Gambling mechanics (betting with virtual currency)
- More games (Dice, Roulette, etc.)
- Multiplayer support
- Achievements system
- Daily rewards
- Social features

## 📄 License

ISC

## 👥 Contributing

This is a personal project, but suggestions and feedback are welcome!
