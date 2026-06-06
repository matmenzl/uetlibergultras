---
name: Strava API 2026 Compliance Guardrails
description: Hard rules from Strava API Policy 2026 — 7-day cache, no aggregation, no AI, deletion, third-party data
type: constraint
---
Strava API Policy 2026 rules that bind every feature touching Strava data:

- **7-day cache (6.2):** check_ins.activity_name/distance/elapsed_time/elevation_gain etc. NULLed after 7 days by cron `strava-data-retention`. Counts and segment matches survive. Manual check-ins (is_manual=true) are user data and exempt.
- **48h delete/deauth (6.3):** strava-webhook handles `activity.delete` (remove check_ins) and `athlete.update authorized=false` (delete tokens + Strava check_ins, null strava_id/profile_picture). Badges stay.
- **Account deletion (2.5/7.4):** Edge function `delete-account` wipes profile, check_ins, credentials, achievements, suggestions, storage avatar, auth user. Sends Resend confirmation email. Logged in `account_deletions`.
- **No aggregation/analytics (5.4):** community_stats view exposes only counts (runs, runners). Never add mean/sum/distribution/heatmap across users. Per-user counts and ranks are OK.
- **No AI/ML (5.3):** Never send Strava data to any LLM, embedding model, RAG store, or vector index.
- **No persistent index (5.5):** No vector stores, search indexes, or knowledge graphs containing Strava data.
- **No MCP server (5.16):** Don't build any MCP/agent interface that exposes Strava data.
- **No paywall on Strava features (5.8):** Premium features must be "beyond Strava" (e.g. Webcam, Uetliberg-specific gamification), not duplicates of Strava functionality.
- **No third-party Strava data (5.10):** Emails, analytics, ads must not contain Strava activity details (run name, distance, time). Aggregated info ("you earned badge X", "rank 3") is OK.
- **Breach notification 24h (8.3):** Any incident → email legal@strava.com within 24h.
- **Avatar:** Strava avatar URL is Strava Data; periodic refresh by webhook on each new activity covers the 7-day rule for active users. (Future: copy to own storage on login.)