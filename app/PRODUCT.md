# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users

Self-administering peptide users who already know their own compounds and doses — this app is not a dosing advisor. They're managing an active peptide protocol and want a single place to track their schedule, rotate injection sites, log physical progress, and manage nutrition — filling a logistics gap their prescribing/sourcing doctor typically doesn't help with.

## Product Purpose

A tracking and logistics companion for people running a peptide regimen: daily/weekly dose schedule, injection-site rotation history, weight/energy/mood check-ins with progress photos, and nutrition macro targets (including an AI meal builder). Success means the user keeps coming back day-to-day to stay consistent and avoid injection-site overuse — not a one-time setup.

## Positioning

Distinct from a peptide dosing calculator or a generic fitness/macro tracker: it assumes the user already knows their protocol and focuses on the operational side — schedule adherence, site rotation, progress tracking — that's specific to injectable-peptide use, a gap no mainstream tracker or doctor currently fills.

## Operating Context

- Solo, self-directed daily use: checking today's due doses, logging an injection with site rotation, periodic check-ins (weight/energy/mood/photos), and occasionally building a meal to hit macro targets.
- Currently runs via Expo (Expo Go on-device, or Expo web in a desktop browser during development). No App Store/Play Store build exists yet.

## Capabilities and Constraints

- Single shared design language across iOS and Android from one React Native/Expo codebase — explicitly not OS-adaptive (confirmed with the user).
- Backend is a custom Node/Express + Postgres API, not a BaaS.
- The app must never give prescriptive dosing advice or recommendations — the legal/liability posture depends on staying a "tracking tool," not a "medical advisor." Users self-report what they're already taking.
- AI features (meal builder) call Claude directly from the backend, constrained to nutrition suggestions only.
- Health-tracker sync (Apple Health / Android Health Connect) is planned but explicitly deferred — not yet built.

## Brand Commitments

"Peptide RX" is a working title only, confirmed open to change as part of this design pass — nothing about the name is locked in. The current visual identity (teal `#3BBFB8` accent on a light background) was ported from an early prototype's CSS and is not a confirmed brand commitment.

## Evidence on Hand

No real user testimonials, case studies, or press exist yet — future work must not fabricate any. The app's existing screens and data model (auth, stack items, injection logs, check-ins, nutrition/meal builder) are functional reference, not visual reference.

## Product Principles

1. Never cross from tracking into medical/dosing advice — every feature respects that boundary.
2. Solo-builder pace: favor durable, low-maintenance patterns over ambitious infra one person can't sustain.
3. The logistics gap (schedule + site rotation) is the core differentiator — don't let secondary features (nutrition, AI) dilute focus on it.
4. Respect user autonomy — users already made their protocol decisions elsewhere; the app supports execution, it doesn't gatekeep or second-guess those decisions.
