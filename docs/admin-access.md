# Admin Access Guide

Admins sign in with Google OAuth. Candidates do not use admin accounts.

## First Admin

Set `INITIAL_ADMIN_EMAIL` before the first login:

```env
INITIAL_ADMIN_EMAIL=admin@example.com
```

When that Google account signs in for the first time, the app automatically creates an admin profile for it. This bootstraps the dashboard without needing an existing admin.

If you change `INITIAL_ADMIN_EMAIL` after deployment, redeploy the app so the new environment value is active.

## Add Another Admin

1. Sign in as an existing admin.
2. Open **Admin Dashboard -> Settings**.
3. In **Admin invites**, enter the new admin's Google email address.
4. Click **Invite admin**.
5. Ask the invited person to open the app and sign in with that same Google account.

The invite is accepted automatically on first successful Google login. The Settings page shows whether each invite is still pending or accepted.

## Troubleshooting

- The invited email must match the Google account email exactly.
- If an invited user sees the public landing page after login, confirm the invite email spelling in **Settings -> Admin invites**.
- If Google OAuth fails locally, confirm the callback URL is configured in Google Cloud:

```text
http://localhost:3000/api/auth/callback/google
```

- If Google OAuth fails in production, add the deployed callback URL:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google
```

## Removing Admins

The current UI supports inviting admins but does not include a remove-admin screen. To revoke access during this take-home demo, remove the corresponding row from `admin_profiles` in the database.
