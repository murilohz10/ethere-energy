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
- Retired module URLs redirect to the app overview and are absent from navigation, onboarding and frontend permissions; why: preserve published links without restoring removed product areas.
- Data interpretation (PLD readings, portfolio, scenarios, configured reports) lives in pure functions in src/lib/interpretation.ts and src/lib/report-builder.ts with vitest coverage; why: numbers and wording stay testable and consistent across pages.
