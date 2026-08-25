# Deploying Cortex

Deploy `backEnd` to Render as a Node web service. Use `backEnd/render.yaml` or set its root directory to `backEnd`; the build command is `npm ci && npm run build`, the start command is `npm start`, and the health path is `/health`.

Deploy `frontEnd` to Vercel with `frontEnd` as the project root. Vercel will run the Vite build and `vercel.json` keeps browser routes working on refresh.

Set every value from `backEnd/.env.example` in Render. In production set `CLIENT_ORIGIN` to the exact Vercel URL, `APP_URL` to the exact Render URL, `CALL_BACK_URL` to `<render-url>/auth/google/callback`, and `SUCCESS_REDIRECT_URL` to `<vercel-url>/auth/callback`.

In Vercel set `VITE_API_URL` to the exact Render URL. Set `VITE_GOOGLE_CLIENT_ID` and `VITE_DEVELOPPER_KEY` only if those frontend integrations are enabled. Vite variables are public in the browser: never place server secrets in them.

Update the Google OAuth client's Authorized JavaScript origins and redirect URI with the Vercel and Render URLs before testing sign-in. Add the same Vercel URL to Stripe's allowed redirect configuration if checkout is enabled.
