# Deploy Cortex: Render API and Vercel client

Environment files are preserved. The localhost values in `.env.example` are now comments, and production placeholders are provided beside them. Never commit real `.env` files or service keys.

## 1. Render: `backEnd`

Create a Render Blueprint from `backEnd/render.yaml`, or create a Node Web Service with `backEnd` as its Root Directory. Use Node 22 or later, `npm ci && NODE_OPTIONS=--max-old-space-size=2048 npm run build` as the build command, `npm start` as the start command, and `/health` as the health check.

The production build now runs `tsc-alias` after TypeScript compilation, so Node can resolve the backend's `@/` imports. Render provides `PORT`; do not override it with a fixed value.

In Render's Environment settings, add every server-side key from `backEnd/.env.example`. Use these URL values after both services receive their final domains:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `CLIENT_ORIGIN` | `https://your-project.vercel.app` |
| `APP_URL` | `https://your-render-service.onrender.com` |
| `CALL_BACK_URL` | `https://your-render-service.onrender.com/auth/google/callback` |
| `SUCCESS_REDIRECT_URL` | `https://your-project.vercel.app/auth/callback` |

Set `DB_URL`, OAuth, Fireworks, Pinecone, Cohere, Exa/Tavily, ElevenLabs, Stripe, and cookie/JWT keys as Render secrets. Do not put any of them in Vercel.

## 2. Vercel: `frontEnd`

Import the same repository as a second project. Set its Root Directory to `frontEnd`; Vercel detects Vite and builds the `dist` directory. The included `vercel.json` preserves React Router deep links on refresh.

Set these Vercel Production environment variables, then redeploy:

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://your-render-service.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID, if Google Drive is enabled |
| `VITE_DEVELOPPER_KEY` | Google API key, if Google Drive is enabled |

All `VITE_*` values are sent to the browser. Never use a secret, database URL, private API key, or Stripe secret key with that prefix.

## 3. Configure external providers

- Google OAuth: add `https://your-project.vercel.app` to Authorized JavaScript origins, and `https://your-render-service.onrender.com/auth/google/callback` to Authorized redirect URIs.
- Stripe: allow the Vercel domain as a checkout redirect destination, if payments are enabled.
- MongoDB Atlas: allow Render network access using Atlas's recommended production network rules.

## 4. Persistence and verification

MongoDB and Pinecone hold the durable data used by the app. Files written under `backEnd/public` are local Render filesystem data and may be lost during a redeploy or restart unless you attach a persistent disk or migrate those files to object storage. Test uploads, generated audio, Google OAuth, payment redirects, and document chat after deployment.
