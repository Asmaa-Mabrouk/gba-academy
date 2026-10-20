# Video, live classes and messaging

## Recorded video (`VideoHosting`)
Lessons have ids in `courses.modules`. The real adapter maps a lesson id to a hosted video (for example Vimeo, Mux, Bunny Stream, Cloudflare Stream) and returns a short-lived signed playback URL, only for enrolled users. Add endpoint `GET /me/lessons/{id}/playback` that checks enrollment and calls `playbackUrl`. Replace the placeholder in `components/Player.tsx` with the provider's player.

## Live classes (`LiveVideo`)
Create a room per `live_sessions` row (`createRoom`, store `join_url`), issue per-learner links (`joinLink`) from `GET /me/sessions/{id}/join` 15 minutes before start (the My Courses text already says so). Options: Zoom Meeting SDK, Microsoft Teams, LiveKit, Jitsi.

## Messaging
`MessagingService.send(to, template, params)`: order receipt, session reminder, welcome email. Use an email provider plus an SMS/WhatsApp provider available in Saudi Arabia.
