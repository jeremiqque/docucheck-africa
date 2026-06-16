# DocuCheck Africa — Supabase Email Templates

Branded, email-safe HTML for the auth emails Supabase sends. Templates are
independent of how the mail is delivered (built-in vs Resend SMTP), so set
these up first, then wire SMTP separately.

## Where to paste

Supabase Dashboard -> your project -> **Authentication** -> **Emails**
(some plans label it "Email Templates"). Pick each tab, set the **Subject**,
paste the matching HTML into the **Message body (HTML)** box, then **Save**.

| Supabase tab        | File                  | Subject line                              |
|---------------------|-----------------------|-------------------------------------------|
| Confirm signup      | confirm-signup.html   | Confirm your DocuCheck Africa account     |
| Reset password      | reset-password.html   | Reset your DocuCheck Africa password      |
| Magic Link          | magic-link.html       | Your DocuCheck Africa sign-in link        |
| Invite user         | invite-user.html      | You have been invited to DocuCheck Africa |

> Each template uses Supabase's `{{ .ConfirmationURL }}` variable, which builds
> the correct verification link for that email type. Do not change it.

## Required: URL configuration (makes the reset redirect work)

Authentication -> **URL Configuration**:

1. **Site URL** — your live app, e.g. `https://your-app.vercel.app`
   (for local testing you can set `http://localhost:3000`).
2. **Redirect URLs** — add every origin your `/reset-password` page runs on:
   - `http://localhost:3000/reset-password`
   - `https://your-app.vercel.app/reset-password`

If `/reset-password` is not in the allowed Redirect URLs list, Supabase will
drop the redirect and the reset link will not land on the new-password screen.

## Token expiry (optional)

Defaults: signup confirm ~24h, password recovery ~1h (the copy in the templates
matches these). Adjust under Authentication -> providers/settings if needed and
update the wording to match.

## Next step

Once templates + URLs are saved, set up **custom SMTP (Resend)** so these emails
actually deliver to any recipient. The built-in sender only emails project
members at a low rate, which is why a real reset email may not arrive yet.
