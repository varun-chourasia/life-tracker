🧬 Chronoly - Life Operating System

Chronoly is a progressive web application (PWA) designed to gamify productivity and collect personal behavioral data. Unlike standard to-do lists, it functions as a data collection engine for personal habits, visualizing consistency through heatmaps and statistical trend lines.

It features real-time cloud synchronization, offline-first architecture, and a "Snapchat-style" streak logic to engineer discipline.

🚀 Key Features

📊 Data & Analytics

GitHub-Style Heatmap: Visualizes daily consistency over the current month.

Trend Analysis: Line charts tracking 7-day task volume trends.

Focus Distribution: Donut charts analyzing time spent on Coding vs. Health vs. Deep Work.

🎮 Gamification Engine

XP System: Earn XP for tasks (+20) and habits (+10). Lose XP for unchecking.

Leveling Logic: Dynamic level-up system with visual progress bars.

Achievements: Auto-unlocking badges (e.g., "Early Bird" for 5 AM tasks, "Night Owl").

Streak Counter: Tracks consecutive active days to build momentum.

🛡️ Engineering & Security

Offline-First: Uses IndexedDB persistence (via Firebase) to work without internet.

Cloud Sync: Real-time synchronization across Mobile and Desktop.

Secure Auth: Email/Password authentication with "Danger Zone" account deletion protocols.

PWA Support: Installable on iOS and Android as a native-like app.

🛠️ Tech Stack

Frontend: React (Vite), TypeScript

Styling: Tailwind CSS

Database: Firebase Firestore (NoSQL)

Auth: Firebase Authentication

Visualization: Recharts

Icons: Lucide React

⚡ Getting Started

Prerequisites

Node.js (v16+)

A Firebase Project (Free Tier)

Installation

Clone the repo

git clone [https://github.com/YOUR_USERNAME/life-os-tracker.git](https://github.com/YOUR_USERNAME/life-os-tracker.git)
cd life-os-tracker


Install packages

npm install


Configure Firebase

Create a project at console.firebase.google.com

Enable Firestore Database and Authentication (Email/Pass)

Copy your config keys into src/App.tsx (or use .env variables).

Run Locally

npm run dev


📱 Mobile Installation (PWA)

Deploy the app (see below) or run locally with npm run dev -- --host.

Open the URL on your mobile browser (Chrome/Safari).

Android: Tap ⋮ > "Install App".

iOS: Tap Share > "Add to Home Screen".

The app will now work offline and appear in your app drawer.

🔮 Future Roadmap (Data Science Integration)

Export to CSV: Already implemented JSON export for analysis.

Python Analysis: Plan to build a script to correlate "Sleep Duration" with "Coding Output".

Predictive Modeling: Use historical data to predict "Burnout Weeks".

Author: Varun Choursiya
Aspiring Data Scientist & Engineer