# Navigation, AI removal, and night-sky background

## User-facing changes
- Remove the AI Assistant from the Notes Vault and remove AI promotional copy from visible app text.
- Remove the timer helper sentence, Recent sessions section, and leaderboard helper sentence previously requested.
- Reduce perceived section-switching delays by caching fetched screens briefly and preloading routes when navigation is intended.
- Add a quiet, persistent starfield and crescent moon behind authenticated app sections.

## Technical details
- Keep the night-sky decoration in the authenticated shell so it remains consistent between sections and does not intercept clicks.
- Set shared TanStack Query freshness and route preload defaults; continue honoring explicit invalidations after user actions.
- Remove the unused AI dialog and client-facing calls; preserve existing database records and unrelated backend data.
- Verify the current admin view, route changes, and narrow-screen layout after the edits.
