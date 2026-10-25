# Design reference checklist — UniHub (https://unihub.az/en) → GoAI.foo

Sources inspected: live page via text fetch on 2026-10-25 (content/structure only — the fetcher returns no CSS or images),
plus prior-project notes `/workspace/unihub-video-notes.md` and screenshot `/workspace/design-ref-unihub.jpg` (screen recording of the live site).

| Area | Observed on UniHub | Adapted in GoAI.foo | Verified? |
|---|---|---|---|
| Header / nav | Sticky floating rounded header card; hides on scroll down, shows on scroll up | `.site-header` pill card, hide-on-scroll, active link = black pill | From video notes |
| Mobile nav | Fixed bottom nav bar, active tab = lime pill | `.bottom-nav` ≤760px, lime active pill | From video notes |
| Typography | Geometric sans, heavy bold tight headings | System sans stack, 800 weight, −0.03em tracking, clamp() sizes (no web-font download, for privacy/perf) | Font family NOT verified (no CSS access); approximated |
| Colors | Lime ≈ #CEFF00/#D4FF32, light bg ≈ #F5F5F6, ink #111, gray #888 | `--lime #C8F135`, `--bg #F4F5F2`, `--ink #111`, `--muted #5f6360` (darker for WCAG contrast) | Hex values estimated from video, not CSS |
| Spacing / width | Generous section spacing, centered container | 72px sections (52px mobile), 1200px max width | Approximate |
| Cards | White cards, 16–24px radius, soft shadows; dark + lime feature cards | `.card` 20px radius, `.card-dark`, `.card-lime` | From video |
| Buttons | Pill buttons, black solid + outline; color inversion on hover | `.btn-dark/.btn-outline/.btn-lime`, invert on hover, 44px min touch target | From video |
| Radii | Pills everywhere, 16–24px cards | 999px pills, 12/20/28px scale | From video |
| Hero | Step badge "01 / 05 LABEL", big heading with lime marker highlight, 3D path illustration with glowing orb | Badge, marker-highlight animation (reduced-motion aware), original SVG illustration (code windows) | Text structure verified via fetch |
| Process | "Complex process. Clear steps." dark timeline | Dark band with IDEA → BUILD → EDIT → PREVIEW → EXPORT, "0N / 05" labels | Verified via fetch |
| Do / Don't | "We do / We don't" lists with check / x | "Why GoAI.foo" / "What we don’t do" lists | Verified via fetch |
| CTA | Lime full-width "Ready?" section | `.cta-band` lime with black heading, pill CTAs | Verified via fetch + video |
| Footer | Dark footer, big white tagline, lime pill button, link columns | Same pattern, original copy | From video |
| Responsive | Bottom nav on mobile, stacked cards | 4→2→1 column grids, stacked hero | From video |

## Not copied (intentionally)
UniHub logo, mascot image, illustrations, wording, investor/startup/event sections. GoAI.foo has its own SVG logo (`public/logo.svg`) and copy.

## Could not verify
- Exact font family, font sizes, hex colors, shadows and breakpoints (no CSS/computed styles available to the fetch tool; values approximated from video/screenshot).
- Exact animation timings and the 3D illustration technique.
- Interior pages of UniHub beyond the notes from the earlier recording.
