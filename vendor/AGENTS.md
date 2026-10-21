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

# Project rules
- This is the aasPass vendor (store owner) app; the customer app is a separate project and the NestJS backend lives in GitHub repo Owaisdln/aasPass (read-only reference). Why: keep apps independent.
- This project uses Expo Router and React Native. Screens live in app/; portable vendor domain code lives in src/features/vendor.
- Types in model.ts mirror backend DTOs exactly; never invent fields or endpoints. Why: live mode must match the real API.
- Every adapter in api/vendor.ts branches on session mode: live calls the backend, sample-store mode uses in-memory demo data. Why: demo works without a server.
- Vendor order queue is sample-only until the backend exposes store-side order endpoints. Why: backend orders are customer-only today.
- Data hooks use TanStack Query from native screens; session mode is only known after secure session hydration.
- Use npm for dependency commands in this workspace. Bun is not installed, and Expo SDK-compatible native versions should be chosen with `npx expo install`.
