# CogniFlow — Implementation Plan for Antigravity

This document is a step-by-step execution plan. Each phase is self-contained, ordered by priority (fix → harden → feature → polish), and written so an AI coding agent (or you) can pick up any single step and implement it without needing the rest of the context. Check off items as they're completed.

**How to use this with Antigravity:** Paste one "Step" at a time as a task, or paste an entire "Phase" if you want it to work through several related changes in one session. Each step lists the files it touches so the agent scopes its changes correctly.

---

## Phase 0 — Critical Fixes (do these first, ~30 min total)

### Step 0.1 — Add missing `cors` dependency [COMPLETED]
**Files:** `server/package.json`
**Task:** Run `npm install cors` inside `server/` so it's explicitly declared in `dependencies` instead of relying on a transitive install. Verify `server/index.js` still imports and uses it correctly (`app.use(cors())`).
**Status:** ✅ Completed (`cors@^2.8.6` installed and verified in `server/package.json`).
**Done when:** `cors` appears under `"dependencies"` in `server/package.json`, and a fresh `npm install` + `npm start` works with no missing-module errors.

### Step 0.2 — Fix multi-tab online/offline tracking
**Files:** `server/socket/socketHandler.js`
**Task:** Replace the current `Map<socketId, userData>` structure for `onlineUsers` with `Map<userId, Set<socketId>>`.
- On `setup`/`connection`: add the new `socketId` to the user's existing `Set` (create the `Set` if it doesn't exist yet).
- On `disconnect`: remove that specific `socketId` from the user's `Set`. Only broadcast "user offline" and remove the user from the online roster when their `Set` size reaches 0.
- Keep broadcasting the online roster as a flat list of `userId`s (not socket IDs) so the frontend doesn't need changes.
**Done when:** Opening the same account in two browser tabs and closing one tab still shows the user as online in the other tab / to other users.

### Step 0.3 — Move non-image uploads to persistent storage
**Files:** `server/controllers/Upload/uploadFile.js`, `server/config/cloudinary.js`
**Task:** For non-image files currently written to local `/uploads`, switch to Cloudinary using `resource_type: "raw"` (or set up an S3 bucket if you prefer AWS). Update the returned `fileUrl` to be the Cloudinary/S3 URL instead of a local static path. Remove the `express.static("uploads")` dependency once migrated, or keep it only as a fallback for old records.
**Done when:** Uploading a PDF/doc returns a Cloudinary URL, and the file is still retrievable after restarting the server (simulating an ephemeral host restart).

### Step 0.4 — Add AI model fallback
**Files:** `server/utils/aiClient.js`
**Task:** Wrap the Gemini/Gemma call in a small retry helper that tries a prioritized list of models, e.g. `["gemma-4-26b-a4b-it", "gemini-2.0-flash", "gemini-1.5-flash"]`. If a call throws (quota, deprecation, region error), catch it and retry with the next model in the list before giving up and returning a graceful error message to the chat room.
**Done when:** Temporarily breaking the primary model name still produces a bot response (falls through to a working model), and a fully invalid config produces a clean user-facing error instead of a crash.

---

## Phase 1 — Security & Reliability Hardening

### Step 1.1 — Environment validation on boot
**Files:** new `server/utils/validateEnv.js`, `server/index.js`
**Task:** Create a function that checks all required env vars exist at startup (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLOUDINARY_*`, `SMTP_*`). If any are missing, log a clear error listing exactly which ones and `process.exit(1)` before the server tries to bind a port.
**Done when:** Deleting a required env var causes an immediate, readable startup failure instead of a runtime crash later.

### Step 1.2 — Rate limiting on sensitive routes
**Files:** `server/routes/authRouter.js`, `server/routes/messageRouter.js`, new `server/middlewares/rateLimiter.js`
**Task:** Install `express-rate-limit`. Create two limiters:
- `authLimiter`: ~5 requests per 15 minutes per IP, applied to `/api/auth/register`, `/api/auth/login`, `/api/auth/verify-email` (prevents OTP spam / brute force).
- `aiMessageLimiter`: a looser per-user limiter (e.g. 20 requests/min) applied wherever a message can trigger a CogniBot call, to protect your Gemini quota from abuse.
**Done when:** Hitting login 6+ times in under 15 minutes returns a 429 with a clear message.

### Step 1.3 — Request validation with zod
**Files:** new `server/validators/` directory, all controllers in `Auth/`, `Chat/`, `Message/`
**Task:** Install `zod`. For each controller that accepts a request body, define a schema (e.g. `registerSchema`, `sendMessageSchema`) and validate `req.body` at the top of the handler, returning a 400 with field-level errors on failure. Do not rely solely on Mongoose schema validation, since that happens after your business logic has already partially run.
**Done when:** Sending malformed bodies (missing fields, wrong types) to any endpoint returns a clean 400 instead of a 500 or a Mongoose stack trace.

### Step 1.4 — Move JWT from localStorage to httpOnly cookies
**Files:** `server/controllers/Auth/userLogin.js`, `server/middlewares/authMiddleware.js`, `client/src/components/auth/AuthForm.jsx`, `client/src/components/auth/ProtectedRoute.jsx`, all `axios` calls
**Task:**
- Backend: on login, set the JWT as an `httpOnly`, `secure` (in production), `sameSite: "strict"` cookie instead of returning it in the JSON body.
- `authMiddleware.js`: read the token from `req.cookies.token` instead of the `Authorization` header.
- Frontend: remove `localStorage.setItem("token", ...)` calls. Configure `axios` with `withCredentials: true` globally. `ProtectedRoute.jsx` should check auth via a `/api/auth/me` call instead of reading localStorage.
- Add a refresh-token flow if you want sessions to persist beyond the access token's short expiry (optional, see Step 1.5).
**Done when:** No JWT appears in `localStorage` or browser dev tools' Application > Local Storage tab; auth still works end-to-end.

### Step 1.5 — (Optional) Refresh token flow
**Files:** `server/models/User.js`, `server/controllers/Auth/userLogin.js`, new `server/controllers/Auth/refreshToken.js`
**Task:** Issue a short-lived access token (15 min) and a long-lived refresh token (7 days, stored hashed in the `User` document or a separate collection). Add a `/api/auth/refresh` endpoint that issues a new access token given a valid refresh token cookie. Frontend axios interceptor should call this endpoint on a 401 and retry the original request once.
**Done when:** An access token expires after 15 minutes but the user stays logged in silently via refresh.

### Step 1.6 — Centralized error handling
**Files:** new `server/middlewares/errorHandler.js`, `server/index.js`, all controllers
**Task:** Create an Express error-handling middleware (4-arg signature) registered last in `index.js`. Refactor controllers to call `next(err)` on failure instead of duplicating `try/catch` + `res.status(500).json(...)` everywhere. Include a custom `AppError` class with `statusCode` and `message` for expected errors (e.g. "Room not found" → 404) vs unexpected ones (→ 500, logged with stack trace but generic message to client).
**Done when:** Every controller is shorter, and errors thrown anywhere in the request lifecycle are caught and formatted consistently.

### Step 1.7 — Structured logging
**Files:** new `server/utils/logger.js`, `server/index.js`, `server/socket/socketHandler.js`
**Task:** Install `pino` (or `winston`). Replace `console.log`/`console.error` calls with the logger. Add a request-ID middleware (`pino-http` or manual UUID per request) so you can trace a single request/socket event through logs. Log all Socket.IO connect/disconnect events and AI call failures at appropriate levels (`info`, `warn`, `error`).
**Done when:** Server logs are structured JSON (or readable leveled output) instead of raw `console.log` strings.

---

## Phase 2 — Core Feature Additions

### Step 2.1 — Message reactions
**Files:** `server/models/Message.js`, new `server/controllers/Message/reactToMessage.js`, `server/routes/messageRouter.js`, `server/socket/socketHandler.js`, `client/src/components/chat/ChatContainer.jsx`
**Task:**
- Schema: add `reactions: [{ user: ObjectId, emoji: String }]` to `Message.js`.
- Backend: new endpoint `POST /api/messages/:id/react` toggles a reaction (add if not present for that user+emoji, remove if present).
- Socket: emit `message reaction updated` to the room with the message ID and updated reactions array.
- Frontend: add a small emoji picker (reuse an existing lightweight lib or a hardcoded set of 6 common emojis) on long-press/hover of a message bubble. Render reaction pills below the message.
**Done when:** Reacting to a message updates in real time for all room members without a page refresh.

### Step 2.2 — Reply / quote a message
**Files:** `server/models/Message.js`, `server/controllers/Message/sendMessage.js`, `client/src/components/chat/ChatContainer.jsx`
**Task:** Add `replyTo: { type: ObjectId, ref: "Message" }` to the schema. When sending a message, optionally pass `replyTo`. Populate it on fetch so the frontend can render a small quoted preview above the message bubble. Clicking the quoted preview scrolls to and highlights the original message.
**Done when:** Users can reply to any message and see a linked preview; clicking it jumps to the original.

### Step 2.3 — In-room message search
**Files:** new `server/controllers/Message/searchMessages.js`, `server/routes/messageRouter.js`, `client/src/components/chat/ChatContainer.jsx`
**Task:** Add `GET /api/messages/search?roomId=&q=` using a MongoDB text index on `Message.content` (`messageSchema.index({ content: "text" })`). Frontend: add a search icon in the chat header that opens a small search bar, debounced query, results list that scrolls to a message on click.
**Done when:** Typing a query returns matching messages in the current room within ~200ms for a few thousand messages.

### Step 2.4 — Voice messages
**Files:** `client/src/components/chat/ChatContainer.jsx` (new recorder component), `server/controllers/Upload/uploadFile.js`, `server/models/Message.js`
**Task:** Use the browser `MediaRecorder` API to record audio client-side, produce a `.webm`/`.mp3` blob, upload via the existing upload pipeline (extend `uploadFile.js` to accept `resource_type: "video"` for audio on Cloudinary, since Cloudinary treats audio under video resource type). Add `messageType: "voice"` and render an `<audio controls>` player (or a custom waveform player) in the chat bubble.
**Done when:** A user can record, send, and play back a voice note inline.

### Step 2.5 — Pinned messages
**Files:** `server/models/Room.js`, new `server/controllers/Chat/pinMessage.js`, `client/src/components/chat/ChatContainer.jsx`
**Task:** Add `pinnedMessages: [ObjectId]` to `Room.js` (cap at e.g. 3 via validation). Add endpoint to pin/unpin (admin-only for groups). Frontend: sticky bar at top of chat showing pinned message(s) with a way to jump to them.
**Done when:** Pinning a message shows it persistently at the top of the chat for all members.

### Step 2.6 — Human @mentions (beyond @cogni)
**Files:** `server/controllers/Message/sendMessage.js`, `server/models/Message.js`, `client/src/components/chat/ChatContainer.jsx`
**Task:** Parse `@username` tokens in outgoing messages against current room members, store `mentions: [ObjectId]` on the `Message`. Frontend: autocomplete dropdown when typing `@` in the input box (reuse pattern from `SearchResults.jsx`). Highlight mentions in rendered messages. Optionally trigger a distinct notification style for mentioned users.
**Done when:** Typing `@` shows a member autocomplete, and mentioned users' messages are visually highlighted.

---

## Phase 3 — CogniBot Upgrades (your differentiator — prioritize this)

### Step 3.1 — Conversation memory / summarization per room
**Files:** `server/utils/aiClient.js`, `server/controllers/Message/sendMessage.js`
**Task:** Instead of passing only the last N raw messages as context, implement a rolling summary: once a room's CogniBot conversation exceeds ~20 messages, generate a short summary of the older portion (one extra Gemini call) and prepend that summary + the most recent ~10 raw messages as context for future calls. Cache the summary on the `Room` document (`aiContextSummary: String`, `aiContextSummaryUpToMessageId: ObjectId`) so you don't regenerate it every turn.
**Done when:** CogniBot can meaningfully reference something said 50+ messages ago without the prompt growing unbounded.

### Step 3.2 — Slash commands
**Files:** `server/controllers/Message/sendMessage.js`, new `server/utils/slashCommands.js`
**Task:** Detect messages starting with `/` before they're treated as normal chat/AI text. Implement at minimum:
- `/summarize [n]` — summarize the last `n` (default 20) messages in the room, posted as a CogniBot message.
- `/translate <lang> <text>` — one-off translation via Gemini, no context needed.
- `/remind me <time> <text>` — store a reminder (new lightweight `Reminder` model + a `setTimeout`/`node-cron` check) and have CogniBot post it back to the room at the specified time.
Route unknown `/commands` to a helpful "unknown command" reply rather than sending them to the AI as a normal prompt.
**Done when:** Each command works from any room and posts a bot response distinguishable from normal chat.

### Step 3.3 — Image generation
**Files:** `server/utils/aiClient.js`, `server/controllers/Message/sendMessage.js`
**Task:** When a user prompt to CogniBot is clearly an image request (simple heuristic: starts with `/imagine` or `generate an image of...`), call an image-generation model (Imagen via Vertex AI, or another provider if Imagen access isn't available on your API key) instead of the text model. Upload the resulting image to Cloudinary and send it back as a normal image message with `isAiResponse: true`.
**Done when:** `/imagine a cat astronaut` posts a generated image into the chat as a CogniBot message.

### Step 3.4 — Tool use / function calling
**Files:** `server/utils/aiClient.js`
**Task:** Use Gemini's function-calling API to give CogniBot 2-3 real tools, e.g.:
- `create_poll(question, options[])` → posts a structured poll message type to the room.
- `get_weather(location)` → calls a free weather API and returns the result in the bot's reply.
Define the tool schemas per Gemini's function-calling spec, handle the `functionCall` response part, execute the corresponding server function, and feed the result back into a second Gemini call to produce the final natural-language reply.
**Done when:** Asking CogniBot "make a poll about pizza vs sushi" produces an actual interactive poll message, not just text describing one.

### Step 3.5 — Streaming responses
**Files:** `server/utils/aiClient.js`, `server/socket/socketHandler.js`, `client/src/components/chat/ChatContainer.jsx`
**Task:** Switch from `generateContent` to `generateContentStream` in the Google Generative AI SDK. As chunks arrive, emit incremental `ai stream chunk` socket events with the accumulated text so far (or just the delta) to the room. Frontend: render the CogniBot message bubble progressively as chunks arrive, then finalize it (persist to DB) once the stream ends.
**Done when:** CogniBot's reply visibly types out token-by-token instead of appearing all at once after a delay.

---

## Phase 4 — Presence, Notifications & Group Maturity

### Step 4.1 — Last seen timestamps
**Files:** `server/models/User.js`, `server/socket/socketHandler.js`, `client/src/components/sidebar/RoomCard.jsx`
**Task:** Add `lastSeen: Date` to `User.js`. Update it on `disconnect` (when a user's socket Set reaches 0, per Step 0.2). Expose it via the user profile fetch. Frontend: show "last seen 5m ago" instead of just a static "offline" label, using a small relative-time helper (`date-fns` `formatDistanceToNow`).
**Done when:** Offline users show a relative last-seen time instead of just "offline."

### Step 4.2 — Offline message delivery queue
**Files:** `server/socket/socketHandler.js`, `server/controllers/Message/sendMessage.js`
**Task:** When a message is sent to a room member who has no active socket connection, don't rely solely on them fetching on next login — on `setup`/reconnect, query for messages where the reconnecting user's ID is not yet in `deliveredTo` for rooms they belong to, and mark/emit delivery at that point. (Note: this may already partially work via your `fetchMessage` pagination — this step is about making delivery *receipts* catch up correctly, not just message content.)
**Done when:** A message sent while a user is offline correctly shows as "delivered" (not stuck at "sent") once that user reconnects.

### Step 4.3 — Web Push notifications
**Files:** new `server/utils/webPush.js`, `client/public/sw.js` (service worker), `client/src/` (permission prompt + subscription logic)
**Task:** Install `web-push`. Generate VAPID keys. Add subscription endpoint to store each user's push subscription object. On new message (when recipient is offline or tab unfocused), send a push notification via `web-push`. Frontend: register a service worker, request notification permission, subscribe, and send the subscription to the backend.
**Done when:** Closing the tab and receiving a message triggers an OS-level notification.

### Step 4.4 — Group roles & invite links
**Files:** `server/models/Room.js`, `server/controllers/Chat/`, new `server/controllers/Chat/generateInviteLink.js`
**Task:** Extend `Room.js` with `moderators: [ObjectId]` alongside the existing `admin`. Add an `inviteToken: String` + `inviteExpiresAt: Date` field; generate via crypto random bytes. New route `GET /api/chat/join/:token` adds the requesting user to the room if the token is valid and unexpired. Add an "announcement-only" `Room.settings.onlyAdminsCanMessage: Boolean` flag enforced in `sendMessage.js`.
**Done when:** An admin can generate a shareable invite link with an expiry, and toggle announcement-only mode.

---

## Phase 5 — Engineering Maturity & Deployment

### Step 5.1 — Automated tests
**Files:** new `server/tests/` directory
**Task:** Install `jest` and `supertest`. Write tests covering:
- Auth: register → OTP verify → login happy path; duplicate email rejection; wrong password rejection.
- Messages: send message, edit own message, fail to edit someone else's, mark as read.
- Rooms: create direct room, create group, add/remove member permissions.
Aim for at least 20-30 tests. Use `mongodb-memory-server` so tests don't hit your real Atlas cluster.
**Done when:** `npm test` runs a full suite against an in-memory MongoDB instance with no external dependencies.

### Step 5.2 — CI pipeline
**Files:** new `.github/workflows/ci.yml`
**Task:** GitHub Actions workflow that on every push/PR: installs dependencies for both `client/` and `server/`, runs `npm run lint` (add ESLint config if missing), and runs `npm test` in `server/`. Fail the build on any lint or test failure.
**Done when:** A badge-worthy green checkmark appears on commits/PRs.

### Step 5.3 — API documentation
**Files:** new `server/docs/openapi.yaml` or Swagger annotations, `server/index.js`
**Task:** Install `swagger-ui-express` + `swagger-jsdoc` (or hand-write an OpenAPI 3.0 YAML spec). Document all routes under `/api/auth`, `/api/chat`, `/api/messages`, `/api/upload`, `/api/user` with request/response schemas. Serve interactive docs at `/api-docs`.
**Done when:** Visiting `/api-docs` shows a browsable, testable API reference.

### Step 5.4 — Dockerize
**Files:** new `server/Dockerfile`, `client/Dockerfile`, `docker-compose.yml`, `.dockerignore`
**Task:** Write a multi-stage `Dockerfile` for the server (Node base image, install deps, copy source, expose port 3000). Write one for the client (build with Vite, serve static output via `nginx` or a lightweight static server). `docker-compose.yml` should wire up server + client + optionally a local MongoDB service for development (Atlas remains fine for production).
**Done when:** `docker-compose up` boots the entire stack from a clean clone with no manual setup beyond providing `.env` values.

### Step 5.5 — README overhaul
**Files:** `README.md`
**Task:** Rewrite the README to include: project description, the architecture mermaid diagram (from the audit report), tech stack table, setup instructions (`.env.example` reference), screenshots/GIFs of key features (chat, CogniBot, read receipts), and a "Known limitations / roadmap" section. This is often the first thing a recruiter or interviewer opens.
**Done when:** Someone with zero context can clone the repo and get it running using only the README.

### Step 5.6 — `.env.example`
**Files:** new `server/.env.example`, `client/.env.example`
**Task:** List every required environment variable with placeholder values and a one-line comment explaining each (e.g. `GEMINI_API_KEY=  # from Google AI Studio`).
**Done when:** No real secrets are needed to understand what configuration the app expects.

### Step 5.7 — Deploy live
**Task:** Deploy `server/` to Render or Railway, `client/` to Vercel or Netlify. Update CORS config on the backend to allow the deployed frontend origin. Add the live URL to the README.
**Done when:** You have a working public link you can hand to anyone.

---

## Phase 6 — Frontend Polish

### Step 6.1 — Error boundaries
**Files:** new `client/src/components/ui/ErrorBoundary.jsx`, `client/src/App.jsx`
**Task:** Standard React class-based error boundary wrapping the main route outlet, showing a friendly "Something went wrong" screen with a reload button instead of a white screen.
**Done when:** Throwing an intentional error in a child component shows the fallback UI, not a blank page.

### Step 6.2 — Loading & skeleton states
**Files:** `client/src/components/sidebar/RoomList.jsx`, `client/src/components/chat/ChatContainer.jsx`, `client/src/pages/Dashboard.jsx`
**Task:** Replace any "blank until data arrives" states with skeleton placeholders (simple animated gray boxes matching the final layout shape) while rooms/messages are fetching.
**Done when:** Initial dashboard load shows skeletons instead of a flash of empty content.

---

## Suggested Execution Order

If working through this incrementally rather than all at once, this order gives the best "always demoable" progression:

1. Phase 0 (all steps — quick, removes real bugs)
2. Step 1.1, 1.2, 1.6, 1.7 (fast reliability wins)
3. Phase 3 (CogniBot upgrades — highest interview/demo impact for the least code)
4. Step 1.3, 1.4 (security depth)
5. Phase 2 (feature richness)
6. Phase 4 (presence/notifications)
7. Phase 5 (deployment & engineering polish — do this before interviews, even if some Phase 2/4 items are skipped)
8. Phase 6 (final polish)
