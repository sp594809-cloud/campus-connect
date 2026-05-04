The OTP logic itself is mostly working: student lookup, registration checks, OTP generation, and rate limiting are in place. The current blocker is SMS delivery. The backend logs show Twilio is rejecting the request with `401 Authentication Error - invalid username`, which means the saved Twilio Account SID/Auth Token combination is not accepted by Twilio.

Plan to resolve it:

1. Stop the preview from crashing on OTP failures
   - Keep all OTP responses as structured JSON.
   - Return user-friendly errors for SMS provider failures instead of raw 502 runtime errors.
   - Ensure the frontend treats `ok: false` responses as normal form errors, not app-breaking failures.

2. Harden the OTP backend function
   - Expand CORS headers to include all headers sent by the current frontend client.
   - Validate request input more strictly: phone number, mode, and supported country format.
   - Delete the generated OTP record if SMS sending fails, so failed sends do not count as valid OTPs.
   - Keep rate limiting active to prevent SMS abuse.

3. Fix the real SMS provider connection
   - Re-test the currently saved Twilio credentials.
   - If Twilio still returns `401`, the code cannot fix that by itself; the Twilio credentials must be corrected.
   - Preferred path: connect Twilio through Lovable’s managed connector so Account SID/Auth handling is managed more safely.
   - Alternative path: update `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` with valid Twilio values.

4. Improve the frontend OTP UX
   - Show a clear setup/delivery message such as: “SMS delivery is not configured correctly. Please contact admin.”
   - Prevent blank screens or runtime overlays for OTP provider errors.
   - Keep “number not in college records”, “already registered”, and “too many requests” as normal inline errors.

5. Test end-to-end
   - Test with a valid roster number such as `8200307992`.
   - Confirm the backend returns either `ok: true` with a masked number or a readable provider setup error.
   - Once Twilio accepts the credentials, verify that the OTP SMS arrives and `verify-otp` completes registration/login.

Important: if Twilio continues returning `401`, we should not keep changing OTP logic. The required next action is to correct or reconnect the Twilio credentials, because Twilio is refusing authentication before any SMS can be sent.

<lov-actions>
<lov-open-history>View History</lov-open-history>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>