# Video, live classes and messaging

## Recorded video (`VideoHosting`)
Lessons have ids in `courses.modules`. The real adapter maps a lesson id to a hosted video (for example Vimeo, Mux, Bunny Stream, Cloudflare Stream) and returns a short-lived signed playback URL, only for enrolled users. Add endpoint `GET /me/lessons/{id}/playback` that checks enrollment and calls `playbackUrl`. Replace the placeholder in `components/Player.tsx` with the provider's player.

## Uploaded lesson video and files (`FileStorage`)
Admins and mentors upload videos (mp4, webm, up to 500 MB), PDFs and Office files, and images from the editor (`POST /uploads`). Files go through the `FileStorage` port; the default `LocalFileStorage` writes to `academy.storage.dir` (`./data/uploads`). **Back this folder up and mount it on a persistent volume in production**, or switch to an object-store adapter (S3 or compatible) by implementing `FileStorage`. Videos are served with HTTP Range and an access check, not as public links. For large audiences put a CDN or a video host (Bunny, Mux, Cloudflare Stream) behind the same `lesson.video` field: an external https link already works today.

## Live classes (`LiveVideo`)
Each `live_sessions` row has `join_url`, `meeting_provider` (`google_meet|manual|fake`) and `meeting_ref`. Port methods: `createMeeting`, `updateMeeting` (session moved), `cancelMeeting` (session deleted). Behaviour:
- Link typed by the admin or mentor (https only): stored as `manual`.
- Link left empty: the adapter creates one when the session is saved. If the provider fails the session is still saved; "Create link" in the editor, or the first Join click by the mentor or an enrolled learner, retries (`ensureMeeting`).
- Mentors open it from *My live sessions*; enrolled learners from the lesson page (`GET /me/sessions/{id}/join`). Nobody else can read the link.

**Adapters.** `FakeLiveVideo` (default, `academy.integrations.live: fake`) returns a placeholder room. `GoogleMeetLiveVideo` (`live: google-meet`) calls the Google Calendar API (`events.insert` with `conferenceDataVersion=1`) and stores the Meet link.

**Set up Google Meet**
1. Use a Google Workspace account that owns the academy calendar (a user such as `live@yourdomain`). Create a Google Cloud project, enable *Google Calendar API*, configure the OAuth consent screen, and create an OAuth client (Web application) with redirect `https://developers.google.com/oauthplayground`.
2. In the OAuth Playground (use your own client in the gear menu), authorise scope `https://www.googleapis.com/auth/calendar.events`, exchange the code, and copy the **refresh token**.
3. Set environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` (`primary` or a calendar id) and `ACADEMY_INTEGRATIONS_LIVE=google-meet`. Keep these in the secret store, never in git.
4. Restart the API, save a live session with an empty link, and check that a `meet.google.com/...` link appears.

**Best practices for a platform-run Meet session**
- Meet limits who may join without being admitted. Attendees are not in your domain, so either let the host admit them, or in Workspace Admin turn *Meet > Safety > Access* to allow quick access / open meetings for the organiser, or move to the Meet REST API (`spaces.create` with `accessType: OPEN`) which creates a space anyone with the link can enter. Test with a personal Gmail account before launch.
- The host (mentor) should join first; share the link only inside the platform (as done here) so it is not forwarded.
- Create the event on the academy organiser's calendar, not the mentor's, so a mentor leaving does not delete the meeting.
- Cohorts are capped by `offerings.capacity`; keep it at or below your Meet licence's participant limit (100 on Business Starter, more on higher plans). For hundreds of viewers use YouTube Live or Meet live streaming instead.
- Recordings and attendance reports need a paid Workspace tier; they are not stored by the platform.
- Alternatives behind the same port: Zoom Meeting SDK, Microsoft Teams, LiveKit, Jitsi. Implement `LiveVideo` and set `academy.integrations.live`.

## Messaging
`MessagingService.send(to, template, params)`: order receipt, session reminder, welcome email. Use an email provider plus an SMS/WhatsApp provider available in Saudi Arabia.
