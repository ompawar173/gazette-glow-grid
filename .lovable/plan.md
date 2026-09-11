# Admin-managed animated latest articles

## Changes
- Add a “Show in Latest” setting to articles.
- Let admins toggle that setting directly from the Articles list.
- Feed the animated Latest strip only from published articles selected by the admin.
- Keep newest selected articles first and fall back to recent published articles until selections are made.

## Technical details
- Add an `is_latest` article field with a safe default and existing article permissions.
- Include the field in homepage content loading and apply selection/fallback logic there.
- Keep the existing continuous animation and article links unchanged.

## Validation
- Verify the admin toggle updates successfully.
- Verify only selected published articles appear in the animated strip on desktop and mobile.
