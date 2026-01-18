# Developer Testing Guide

## Local Authenticated Playwright Testing

We use Playwright for end-to-end testing. To test protected routes (like `/village`, `/settings`), we use a persisted authentication state so you don't have to log in for every test run.

### 1. Setup (Run Once)

This command launches a headed browser for you to manually log in. It saves your session to `.playwright/.auth/state.json`.

```bash
npm run pw:setup
```

**Steps:**

1. Run the command.
2. A browser window opens.
3. Log in manually (e.g., using magic link or password).
4. Wait for the browser to close automatically (or close it after you are redirected to the dashboard).

### 2. Run Tests

Once setup is complete, you can run the authenticated tests. These will reuse your saved session.

```bash
npm run pw:test
```

### 3. Debugging / UI Mode

To run tests with a visual UI explorer:

```bash
npm run pw:ui
```

### Troubleshooting

- **Tests failing with "Sign in"?**
  Your session may have expired. Delete the auth file and run setup again:

  ```bash
  rm .playwright/.auth/state.json
  npm run pw:setup
  ```

### 4. Review Mode (Manual Inspection)

To inspect the dashboard in a logged-in state without running tests:

```bash
npm run pw:review
```

This opens a browser window and pauses execution. You can click around to verify UI. Close the window or use the Playwright Inspector to stop.
