/**
 * Accessibility violations that exist in the application today and are *not* fixed by the ticket
 * that introduced this sweep (WEB-299), keyed by the route template they appear on and listed by
 * axe rule id.
 *
 * An entry is an exception, not a permission: every one of them names the follow-up ticket that
 * removes it. Anything a scan reports that is *not* listed here fails the run, so a new violation
 * can never sneak in. An entry that no longer fires is reported as stale in the CI summary — the
 * fix landed, so the line belongs in the same commit.
 *
 * The list is deliberately keyed by route only, not by route and browser project: a rule that fires
 * on one viewport but not the other is the same defect either way.
 */
export const KNOWN_VIOLATIONS: Readonly<Record<string, readonly string[]>> = {};
