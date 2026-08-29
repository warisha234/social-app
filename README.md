# Gramline — Instagram-style Social App

A full social media web app (stories, posts, likes, comments, reposts, saves,
follow/unfollow, direct messages, notifications, search, and account
settings) built with:

- **Frontend:** React (Vite) + Tailwind CSS + React Router
- **Backend:** Node.js + Express + MongoDB (Mongoose) + JWT auth
- **File uploads:** Multer (images & videos for posts/stories/avatars)

The UI follows the layout you shared — left sidebar navigation, stories
row, feed cards with like/comment/share/save, and a right panel with
suggestions.

---

## 1. What you need before you start

- **Node.js** 18 or newer — [nodejs.org](https://nodejs.org)
- **A free MongoDB Atlas account** — [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register)
  1. Create a free cluster.
  2. Under **Database Access**, create a database user + password.
  3. Under **Network Access**, add your IP (or `0.0.0.0/0` for testing).
  4. Click **Connect → Drivers**, copy the connection string. It looks like:
     `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`

---

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/gramline?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_you_like
PORT=5000
```

Run the server:

```bash
npm run dev
```

You should see:

```
MongoDB connected: gramline
Server running on http://localhost:5000
```

Uploaded images/videos are stored in `backend/uploads/` and served at
`http://localhost:5000/uploads/<filename>`.

---

## 3. Frontend setup

Open a **new terminal**:

```bash
cd frontend
npm install
cp .env.example .env
```

By default `.env` points to `http://localhost:5000/api` — leave it as is
if you're running the backend locally on port 5000.

Run the app:

```bash
npm run dev
```

Open the printed URL (usually `http://localhost:5173`). Sign up for a new
account and you're in.

---

## 4. Features included

| Area | What's included |
|---|---|
| Auth | Sign up, log in, JWT sessions |
| Stories | Upload image/video stories (auto-expire after 24h), gradient "seen/unseen" rings, tap-through viewer |
| Feed | Latest / Popular sort, posts from people you follow |
| Posts | Image or video, caption, location |
| Engagement | Like, comment (with a comments drawer), repost, save |
| Profile | Avatar, bio, note, followers/following counts, tabs for Posts / Reposts / Saved |
| Follow | Follow / unfollow, suggestions panel |
| Search | Live user search by username or name |
| Messages | Direct message threads between two users |
| Notifications | Likes, comments, follows, reposts |
| Settings | Private account toggle, change password, **deactivate account**, **permanently delete account** |

---

## 5. Project structure

```
social-app/
├── backend/
│   ├── config/db.js            MongoDB connection
│   ├── models/                 User, Post, Comment, Story, Message, Notification
│   ├── middleware/              auth.js (JWT), upload.js (Multer)
│   ├── controllers/             business logic per feature
│   ├── routes/                  Express routes per feature
│   ├── uploads/                 uploaded media (gitignored in real use)
│   └── server.js                app entry point
└── frontend/
    ├── src/
    │   ├── api/api.js            axios instance with auth header
    │   ├── context/AuthContext.jsx
    │   ├── components/           Sidebar, TopBar, PostCard, StoriesBar, StoryViewer, etc.
    │   └── pages/                Login, Signup, Home, CreatePost, Profile, Messages, ...
    └── index.html
```

---

## 6. Notes for taking this further

- Passwords are hashed with bcrypt; sessions use JWT stored in
  `localStorage` on the frontend.
- Deleting an account removes the user's posts and their id from other
  users' follower/following lists.
- To deploy: host the backend (Render/Railway/EC2/etc.) with your
  `MONGODB_URI` and `JWT_SECRET` as environment variables, then set
  `VITE_API_URL` in the frontend to your deployed backend's `/api` URL and
  build with `npm run build`.
- For production file storage, swap the local `uploads/` folder for a
  cloud bucket (e.g. Cloudinary or S3) — right now files are saved to disk
  on the server.
