# NeerDrishti Authentication

## Architecture

NeerDrishti uses Supabase Auth with email/password and the official
`@supabase/ssr` package. The browser uses the public
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` through
`lib/supabase/client.ts`. The server uses the same public credentials through
`lib/supabase/server.ts` and reads the request's cookie-backed session.

The service-role credential is not used by authentication and remains confined
to server-only data tooling. It is not referenced by client components.

## Routes and session handling

- `/` remains the public project landing page and links to authentication.
- `/auth` provides sign-in and account registration in one minimal form.
- `/auth/callback` exchanges Supabase's PKCE confirmation code for a session.
- `/app` is the protected verification page.
- `proxy.ts` calls the Supabase SSR client on each relevant request to refresh
  cookies and perform an optimistic authenticated-route check. The protected
  page performs the authoritative server-side `auth.getUser()` check.

The browser client is a singleton, while server clients are request-scoped.
Supabase manages session persistence and refresh through cookies; passwords are
sent to Supabase Auth and are never stored by NeerDrishti. Server code can use
`getCurrentUser()` from `lib/auth.server.ts` to determine the authenticated
user. No component manually handles JWTs or stores session tokens.

## Flows

- Sign in calls `auth.signInWithPassword()` and redirects to `/app`.
- Registration validates email, non-empty password, and matching confirmation,
  then calls `auth.signUp()`.
- If Supabase returns a session immediately, registration redirects to `/app`.
  If email confirmation is required, the user is told to check their email.
- Sign out calls `auth.signOut()`, refreshes navigation, and redirects to
  `/auth`. The next protected request is rejected.
- Authentication errors shown in the UI are generic and do not expose backend
  details.

## Environment and dashboard configuration

Required local variables are:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The project-specific email-confirmation setting was not changed or assumed.
The implementation supports both immediate sessions and confirmation-first
sign-up. In the Supabase dashboard, verify that Email provider authentication
is enabled and add the application origins to Auth URL Configuration, including
the callback URLs:

```text
http://localhost:3000/auth/callback
https://your-production-origin.example/auth/callback
```

Use the actual production origin when deploying. Supabase's email provider,
confirmation setting, and SMTP/email delivery are external configuration and
must be checked manually.

## Security considerations and limitations

- Only Supabase Auth handles passwords and sessions.
- The anon key is public by design; the service-role key is never sent to the
  browser.
- Server identity checks use `auth.getUser()` rather than trusting an
  unverified cookie session. Proxy uses verified claims for refresh and early
  route gating; the protected page remains the final check.
- Groundwater schema, RLS, importer, query layer, Explorer, analytics, Gemini,
  RAG, and admin features are outside this ticket.
- Automated browser authentication was not run because it would require a
  real user account and credentials. Static validation, TypeScript, lint, and
  production build checks were run; the complete email confirmation flow needs
  manual browser verification after dashboard URLs/provider settings are
  confirmed.

## Validation

Run the credential-free static check with:

```text
node scripts/validate-auth-foundation.mjs
```
