# Voice Recorder Pro

A professional voice recording application built with Vite, TypeScript, and Supabase. Features high-quality audio recording, local storage, and AI-powered transcription capabilities.

## Features

- 🎤 **High-Quality Recording**: Capture audio from both microphone and system audio
- 🔐 **Google Authentication**: Secure login with Google OAuth
- 💾 **Local Storage**: Recordings stored locally with browser storage
- 🎵 **Audio Playback**: Built-in audio player with controls
- 📱 **Responsive Design**: Modern, professional UI with smooth animations
- 🚀 **Edge Functions**: Supabase Edge Functions for AI transcription
- 📊 **Recording History**: Manage and organize your recordings

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for frontend deployment)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd voice-recorder-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp env.example .env.local
```

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Configure Google OAuth

1. In your Supabase dashboard, go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID and Secret)
4. Add `http://localhost:3000/dashboard` to your Google OAuth redirect URIs

### 4. Set Up Database

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Start local development
supabase start

# Apply migrations
supabase db reset
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

## Deployment

### Frontend (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. **Update Google OAuth Redirect URIs** in Supabase:
   - Add your Vercel domain: `https://your-app.vercel.app/dashboard`

### Backend (Supabase)

1. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy transcribe
   ```

2. **Set Edge Function Environment Variables** in Supabase dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

3. **Update Site URL** in Supabase Auth settings:
   - Set to your Vercel domain: `https://your-app.vercel.app`

## Project Structure

```
src/
├── components/          # React components
│   ├── AudioPlayer.tsx
│   ├── Header.tsx
│   ├── LoginPage.tsx
│   ├── RecordingForm.tsx
│   ├── RecordingHistory.tsx
│   └── RecordingInterface.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── hooks/             # Custom hooks
│   ├── useAudioRecorder.ts
│   └── useLocalStorage.ts
├── lib/               # Library configurations
│   └── supabase.ts
├── types/             # TypeScript types
│   └── recording.ts
├── App.tsx            # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles

supabase/
├── config.toml        # Supabase configuration
├── functions/         # Edge functions
│   └── transcribe/    # AI transcription function
└── migrations/        # Database migrations
    └── 20240101000000_create_recordings_table.sql
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Roadmap

- [ ] AI-powered transcription integration
- [ ] Cloud storage for recordings
- [ ] Advanced audio editing features
- [ ] Mobile app development
- [ ] Team collaboration features
- [ ] Advanced analytics and insights
