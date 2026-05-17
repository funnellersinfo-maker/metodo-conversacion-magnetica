# Worklog

## 🔴 UNIVERSAL SELF-AUDIT INSTRUCTION (PERMANENT)
**RULE**: Before delivering ANY final result, ALWAYS self-audit for:
1. **Overlapping elements** — No element may overlap another unless intentionally layered (backgrounds, overlays)
2. **Z-index conflicts** — Verify z-index hierarchy: backgrounds < content < fixed overlays < watermark
3. **Responsive safety** — Check both desktop AND mobile viewports (375x667 minimum)
4. **Absolute positioning** — NEVER use `absolute` for elements that could collide with flow content; use flex column flow instead
5. **Button safety** — CTA buttons must be in document flow (NOT absolute) to prevent text-button overlap on small screens
6. **VLM visual verification** — When possible, use VLM to screenshot and verify no overlaps before delivering
**APPLIES TO**: All future changes, all agents, all components

---

## Rebuild + PreCallVideo

**Agent**: main
**Status**: COMPLETED

### What was done:
- Project was reset to scaffold — all funnel components were lost
- Rebuilt from scratch: next.config.ts (`output: 'export'`), layout.tsx (Cinzel font, SEO), page.tsx
- Recreated CinematicLanding.tsx — Layer 1 with flames, CopyFilms branding, flex-column no-overlap layout
- Created PreCallVideo.tsx — auto-play video on CTA click, mobile optimized
- Video optimized: 5.1MB → 534KB (90% reduction), 540x960, H.264, faststart
- Created FunnelOrchestrator.tsx — watermark + step flow (landing → pre_call_video)
- Removed API route for static export, fixed build script
- Purged large files from git history
- VLM audit passed: desktop ✅ mobile ✅ no overlaps ✅
- Cloudflare deployed, GitHub pushed

### Key Files:
- `src/components/funnel/CinematicLanding.tsx` — Layer 1 (hook/threshold)
- `src/components/funnel/PreCallVideo.tsx` — Layer 2 (video auto-play)
- `src/components/funnel/FunnelOrchestrator.tsx` — Orchestrator + watermark
- `public/videos/pre-llamada.mp4` — Optimized video (534KB)

### Flow:
1. Landing → user clicks "ENTRAR EN LA EXPERIENCIA"
2. PreCallVideo → auto-plays /videos/pre-llamada.mp4
3. Awaiting audio file from user to overlay on video

### Live:
https://metodo-magnetico-dante.pages.dev
