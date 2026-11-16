---
name: clinical-ui
description: The standing design and safety checklist for peptide-RX. Use before changing any UI, copy, dose display, state indicator, or streak behaviour in this app, and when auditing a screen for AI-generated-looking design. Covers the pinned visual brief, ISMP dose-formatting rules, state encoding, streak ethics, the accessibility floor with correct WCAG levels, and the legal line between logging and advising. Overrides generic design skills where they conflict.
user-invocable: true
argument-hint: "[audit|check <file>] — omit to load the checklist"
---

peptide-RX is a **record-keeping tool for injectable peptide protocols**. It logs what the user says they did. It never recommends, calculates, or interprets.

This file outranks any generic design skill, including `impeccable`. Where they disagree, this wins. A generic design checklist will flag this app's big numerals and tracked uppercase labels as a "hero-metric template" — for a clinical readout those **are the product**, not decoration. Never strip informational density to satisfy a checklist.

---

## 0. The pinned brief

In the user's own words, and it has been reaffirmed more than once:

> "I like the aesthetic of the app how it is like very informative and medical it shouldn't look like a fucking toy."

Current direction: pale teal ground, white panels, brand teal `#56B0AD`, IBM Plex Sans + IBM Plex Sans Condensed numerals, radii 4/6/8/10. **Read `app/src/theme.ts` for live values — never trust a hex remembered from a document.**

**Reference apps:** Clue (not Flo), FreeStyle Libre / Dexcom, Apple Health's provenance line. **Anti-reference:** Oura, Whoop, Levels, MyFitnessPal, Flo. The difference is not polish — it is that the anti-references convert real measurements into invented unit-less scores.

**Never ship a composite score.** No "readiness", no 0–100 rating, no letter grade. A number with no unit and an undisclosed formula is the defining toy signal, and here it is also a regulatory liability (§5).

Borrow Epic/Cerner's *number formatting*. Borrow nothing of their density — EHRs score ~46 on SUS, a failing grade, and information overload there is linked to higher error rates.

---

## 1. AI tells — three bins

Sort every finding into one of these. The failure mode being audited for is **unchosen**, not **common**.

### 1a. Fix: the tell and the defect are the same thing

- **Low-contrast grey text.** `#9CA3AF`-class greys on white are ~2.8:1. On a dose or a date this is a safety defect, not a taste one.
- **State encoded in colour alone.** WCAG 1.4.1, Level A — below AA, so non-negotiable. See §3.
- **One radius + one shadow on every surface.** Makes inputs indistinguishable from cards; a tap-target comprehension problem.
- **Nested cards 2–3 deep.** Destroys the scanability a tracker lives on. Group with whitespace first, hairline second, card third — one level of containment.
- **Flat density.** Same padding everywhere, no rhythm. Tight inside a group, generous between groups.
- **Numbers without their period, basis, or unit.** In a medical app a sourceless number is a trust problem.
- **Missing states** — no focus-visible, no error, no empty, no loading. The form *is* the product here.

### 1b. Fix: free, pure signal, costs nothing

Indigo→violet gradients (`#6366F1 → #9333EA`) · gradient-filled headline text · coloured left-border stripes on cards · emoji used as icons · badge-above-centred-H1 heroes · three identical icon-topped feature cards · `Sparkles` as the AI icon · generator fingerprints in `package.json`.

### 1c. **Explicitly ignore** — convention is the correct answer

Do not "fix" these. They are decisions already made, or they are Jakob's Law doing its job: users spend their time in other apps and expect yours to behave the same. For someone logging a dose while tired, **familiarity is a safety feature**.

- **The teal `#56B0AD`.** A catalogued rule flags "teal/emerald as the lone accent when the brief did not ask for green". This one *was* briefed — it comes off the user's own logo and carries one meaning. The rule's own test is whether the accent was briefed and has a job. It passes. **Do not raise this again.**
- **IBM Plex.** The real tell is "Inter *unchosen*" — nobody deciding. This was decided, against alternatives, for its small-size legibility and its condensed numerals.
- **The adherence ring.** Settled twice. It is the only round form on a screen of rectangles and it carries the visual rhythm.
- Conventional layouts, standard components, boring restraint, a familiar settings page.
- **Copy tells** ("seamlessly", "unlock", em-dash frequency). The strongest available research found no empirical basis for these as AI markers, and credible pushback exists. Treat as a quality question, never as evidence.

### Evidence note, so this is not cargo-culted

The only measured study is Krebs's deterministic CSS scan of 1,590 Show HN pages: 22% tripped 4+ patterns, 46% tripped 0–1, **5–10% self-reported false-positive rate**. Everything else in this genre is practitioner opinion. Two widely-circulated figures ("63% of landing pages", "67%") have no traceable source. **Score combinations, never single patterns.**

### Two tests no grep will find

- **Squint test** — view the screen at 25%. If every section weighs the same, hierarchy is flat.
- **Greyscale test** — desaturate a screenshot of the dose list. Every state must still be identifiable.

---

## 2. Dose display — ISMP rules, non-negotiable

Documented tenfold human overdoses sit behind the first two rows.

| Never render | Always render | Risk |
|---|---|---|
| `.5 mg` | `0.5 mg` | read as 5 mg — 10× |
| `1.0 mg` | `1 mg` | read as 10 mg — 10× |
| `10 U`, `10 u` | `10 units` | `U` → 0 or 4 |
| `10 IU` | `10 units` | `IU` → IV, or the number 10 |
| `10 µg`, `10 ug` | `10 mcg` | `µ` → `m` — 1000× |
| `0.5 cc` | `0.5 mL` | `cc` → `u` |
| `SQ`, `SC`, `sub q` | `subcutaneous` | `SC` → sublingual; `q` → "every" |
| `QD`, `QOD`, `QID` | `once daily`, `every other day` | mutually confusable |
| `250 mcg @ 8am` | `250 mcg at 08:00` | `@` → `2` |
| `250mcg` | `250 mcg` | runs together |

**Rules that follow:**

- **One `formatDose(value, unit)`, used everywhere.** Never string-concatenate a dose anywhere else.
- **Never store a dose as a float.** `0.30000000000000004 mg`. Integer mcg, or `numeric`, plus a unit enum.
- **Unit is a picker, never free text.** Free text is how `u` and `µg` enter the database.
- **Normalise server-side too.** The client is not the only writer.
- **Echo the parsed dose back under the input** before save — the cheapest misread-catcher that exists.
- **Numerals use `fontVariant: ['tabular-nums']`** and are right-aligned, decimal-aligned. Biggest credibility gain per line of code in the whole app.
- **Unit is subordinate to the number** — smaller, lighter, baseline-aligned, with a space. Never equal weight.
- **Never compute mg → syringe units.** That is a dose calculation and it crosses the line in §5.

---

## 3. State encoding

Every state carries **word + shape + colour**. Colour is never load-bearing.

| State | Word (visible) | Shape | Note |
|---|---|---|---|
| Due | `Due 08:00` | outline clock | — |
| Logged | `Logged 08:12` | filled check in solid disc | add provenance |
| Not logged | `Not logged` | hollow dashed ring | an **absence** |
| Skipped | `Skipped` | hollow ring with a dash | a **decision** |
| Off-cycle | `Off cycle — day 4 of 14` | horizontal bar | never a failure state |

- **`Skipped` and `Not logged` must stay distinct.** Conflating a decision with an absence is a data-integrity bug and a trust bug.
- Never a bare red dot. Never a bare green check without the word.
- Avoid red/green as the only axis — ~8% of men have red-green CVD. Differentiate by lightness as well as hue.
- The word goes in the accessible name too, not just the icon.

---

## 4. Streak ethics

A streak on a **drug protocol** is not a streak on a language lesson. It can create pressure to dose, and pressure to log a dose that was not taken. Once it punishes honesty, users back-fill fake logs and the record the app exists to produce becomes worthless.

**What the evidence actually supports** (Silverman & Barasch, *J. Consumer Research* 49(6), 2023, seven studies):

- The demotivating effect of a broken streak depends on **how the log represents it**, not on actual past behaviour. The UI is the causal variable.
- It is **worse when the user attributes the break to themselves**.
- It is **attenuated when the streak can be repaired**.
- Effect sizes are modest (~66% vs ~58% continuing).

**Weak or unsourced — do not cite:** that gamification improves medication adherence (the one adherence-specific RCT was null, 79.6% vs 78.6%); the "62%→89%" figure (vendor blog, untraceable); any claim of measured streak *harm* in a medication context (no controlled study exists — it is a design critique, and should be stated as one).

**Rules:**

1. Call it **days on protocol**, never "streak". No flame.
2. **Off-cycle days are compliant behaviour**, never a failure. Rest days count for opening the app.
3. **Repair must exist** — grace days, or "mark that as a planned rest day". This is the one evidence-backed mitigation.
4. **Skipping is free** and does not degrade the headline number. If skipping is punished, users lie, and the side-effect data dies with it.
5. **Externalise the break in copy.** `Gap on 12 Nov. Protocols have gaps — your 30-day rate is 93%.` Never `You broke your 34-day streak!`
6. **No loss-framed notification.** "Your streak ends in 3 hours" pointed at a subcutaneous injection is coercive.
7. No leaderboards, no social comparison on adherence.

---

## 5. The legal line

The app's lane, close to verbatim from FDA's enforcement-discretion list: **collect, track, trend, remind.** Nothing else.

| Safe — logging | Unsafe — advising |
|---|---|
| Record what the user says they took | Suggest a dose or titration |
| Remind at a time **the user set** | Recommend a schedule or cycle length |
| Show the user's own history | Interpret it ("your levels suggest…") |
| Record a side effect | Say whether it is normal or concerning |
| Next site in an order **the user defined** | Tell the user where to inject |
| Store a note the user typed | Compute mg → syringe units |
| A compound name the user typed | A library with "typical doses" |

That last row is the likeliest trap: **a built-in peptide catalogue with suggested dose ranges is a dosing recommendation**, even when the user picks from it. Ship names, aliases and units only — no default dose, no default frequency, no "common protocol" presets.

**Verbs to avoid:** should · recommended · suggested · optimal · ideal · safe · correct dose · take · administer · titrate · treat · prevent · therapeutic · boost · optimise · your levels · normal range.

**Verbs to use:** log · record · track · history · you entered · you logged · you scheduled · you set · mark as · your protocol · not logged.

| Don't ship | Ship |
|---|---|
| "Time to take your dose" | "Dose scheduled for 08:00" |
| "Your next dose: 250 mcg" | "You scheduled: 250 mcg" |
| "Recommended site: left abdomen" | "Next in your rotation: left abdomen" |
| "You should cycle off after 12 weeks" | "You set this cycle to 12 weeks. Day 84 of 84." |
| "Optimal adherence!" | "28 of 28 scheduled doses logged" |

**A disclaimer cannot rescue advisory copy.** The FTC's worked example is an acne app whose "does not treat medical conditions" disclaimer was ruled "directly contradictory… and ineffective to negate" the claim, and a disclaimer in the same size and style below the claim was "insufficiently prominent". Fix the verbs first; the disclaimer is a backstop.

**Unresolved and worth real legal advice:** the FDA general-wellness safe harbour likely does **not** cleanly cover injectable-peptide tracking, because subcutaneous injection carries tissue-injury and infection risk, which fails the "low risk" half of the test. The enforcement-discretion list for tracking/reminder software is firmer ground. That guidance was also revised in January 2026 — re-read the current text before writing legal copy.

---

## 6. Accessibility floor — correct levels

Get the levels right; they have been cited wrongly in this project before.

| Criterion | Level | Requirement |
|---|---|---|
| 1.4.1 Use of Color | **A** | Colour is never the only channel. Below AA — non-negotiable. |
| 1.4.3 Contrast | AA | 4.5:1 text; 3:1 for ≥24px or ≥18.66px bold |
| 1.4.11 Non-text Contrast | AA | **3:1** for component boundaries and meaningful graphics |
| 2.5.8 Target Size (Minimum) | AA | **24×24** — *not* 44 |
| 2.5.5 Target Size (Enhanced) | AAA | 44×44 |
| 2.5.7 Dragging Movements | AA | every swipe needs a tappable equivalent |
| 2.4.11 Focus Not Obscured | AA | — |
| 3.3.7 Redundant Entry | A | don't re-ask for what was just entered |
| 2.3.3 Animation from Interactions | AAA | honour it anyway; it is nearly free |

**44×44 is the Apple HIG / Material convention and we ship it — but cite it as that, not as WCAG AA.**

Check contrast against the surface a colour is **actually drawn on**. The page is `colors.bg`, panels are `colors.panel`, and the page is darker — a value that passes on white can fail there. This app has shipped three contrast failures that were only caught by computing them.

**React Native specifics:**

- **Spell units out in `accessibilityLabel`.** A screen reader says "em cee gee" for `mcg`. Write `"Semaglutide, 250 micrograms, logged at 08:12"`.
- `accessible` on a dose row makes it one unit and suppresses children — use deliberately so the row reads as one sentence.
- `accessibilityRole`: `button` on every Pressable, `header` on section titles, `progressbar` with `accessibilityValue.text` so the cycle bar reads "day 14 of 28", not "50 percent".
- `accessibilityState`: `checked` for logged, `selected` for an active site, `disabled` for off-cycle. **There is no state for "overdue"** — put it in the label text.
- `accessibilityLiveRegion` is **Android-only**. Pair it with `AccessibilityInfo.announceForAccessibility()` for iOS.
- Gate motion on `AccessibilityInfo.isReduceMotionEnabled()`.
- **Never make visibility depend on an animation succeeding.** This app once rendered its entire first-run flow at `opacity: 0` because a babel plugin had not been applied. Content must be visible if the animation never runs.
- Test at the largest accessibility text size. Never truncate a number or a unit.

---

## 7. Verification

Mechanical checks, so none of this rests on taste:

```bash
cd app

# Token drift — raw values that should be theme tokens
grep -rn "#[0-9A-Fa-f]\{6\}" src --include=*.tsx | grep -v "theme.ts"
grep -rn "borderRadius: [0-9]" src --include=*.tsx
grep -rn "fontSize: [0-9]" src --include=*.tsx

# AI tells
grep -rni "from-indigo\|from-violet\|from-purple\|bg-clip-text\|border-l-4" src
grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src --include=*.tsx   # emoji

# ISMP violations
grep -rn "µg\|\bug\b\|\bIU\b\|\bSQ\b\|\bQD\b\|\bcc\b" src --include=*.tsx
grep -rnP "\d\.0\s*(mg|mcg|mL)|\s\.\d" src --include=*.tsx

# Advisory verbs
grep -rni "should take\|recommended dose\|optimal\|titrate\|your levels" src

npx tsc --noEmit
```

Both packages must typecheck clean before any commit. `cd server && npx tsc --noEmit` too.

---

## 8. Order of work

When fixing a batch, do it in this order — safety first, cosmetics last:

1. `formatDose()` + unit enum + numeric storage + server-side normalisation
2. Tabular numerals, decimal alignment, subordinate units
3. State tri-encoding; `Skipped` separated from `Not logged`
4. Verb audit; delete any default doses or dose arithmetic
5. Touch targets, spelled-out accessibility labels, reduce-motion gate
6. Token drift, density rhythm, containment depth
