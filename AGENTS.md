<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Stage planner state lives in zustand stores under src/lib (stage-store, notifications); swap their actions for backend calls later to keep UI untouched.
- Imported 3D models: files live in the private `stage-assets` storage bucket, metadata in `asset_library`; stage objects of type "custom" reference it via `asset_id` and load through cached signed URLs (src/lib/asset-library.ts, CustomModel.tsx). Why: one file shared by many instances, no binaries in the database.
- Auth: all app pages live under src/routes/_authenticated (client-only gate redirects to /login, loads the user's single role from user_roles and redirects disallowed paths); section access per role is defined once in src/lib/access.ts and reused by the sidebar and gate. Why: one source for UI and route guards, while RLS (has_role/has_any_role) is the real enforcement.
