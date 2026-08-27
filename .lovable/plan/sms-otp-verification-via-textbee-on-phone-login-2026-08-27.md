# SMS OTP verification via TextBee on phone login

Add a real one-time-password step to the phone sign-in screen. After a student's number is found in the college roster, they receive a 6-digit code by SMS (sent through TextBee) and must enter it correctly before the app signs them in.

## User flow

```text
Enter phone -> roster lookup -> confirm name/enrollment
   -> "Send code"  (SMS arrives via TextBee)
   -> enter 6 digits (resend after 30s, expires in 5 min)
   -> verified -> signed in -> /onboarding or /campus
```

No bypass: if TextBee is not configured or the SMS fails, the screen shows a clear error and login does not proceed.

## What gets built

1. **`send-otp` edge function** — validates the phone, confirms it exists in the roster, rate-limits (max 3 sends per number per 15 min), generates a 6-digit code, stores only its hash in the existing `otp_codes` table with a 5-minute expiry, then calls the TextBee send-SMS API. Returns success or a clear failure reason. Never returns the code.
2. **`verify-otp` edge function** — checks the latest unconsumed code for that phone: not expired, under 5 attempts, hash matches. On success marks it consumed and returns a short-lived verification token (signed, phone-bound, 10-minute validity) the client passes to the sign-in step.
3. **Client changes on the login screen** (`frontend/src/pages/Index.tsx`) — insert an OTP step between "confirm details" and "Continue": send button, 6-digit input (using the existing OTP input component), countdown + resend, attempt/error messaging. The existing sign-in logic only runs once verification succeeds.
4. **Config** — register both functions in `supabase/config.toml` with `verify_jwt = false` (they run pre-auth).

## Technical notes

- `otp_codes` already exists with the right shape (`phone_number`, `code_hash`, `expires_at`, `attempts`, `consumed`) and has no client policies — only the edge functions (service role) touch it. No schema change needed.
- Codes are hashed with SHA-256 plus a server-side pepper; plaintext is never stored or logged.
- The verification token is an HMAC of `phone + expiry` using a server secret, so a client cannot skip straight to sign-in.
- Secrets required: `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID` (you provide), plus an auto-generated `OTP_SIGNING_SECRET`.
- Phones are normalized to `+91XXXXXXXXXX` for SMS; the app keeps storing the 10-digit form.
- Existing roster RPCs (`lookup_student_by_phone`, `is_phone_registered`) stay as-is.

## After approval

I'll open a secure form to collect the TextBee API key and device ID, then build and test the flow end to end.
