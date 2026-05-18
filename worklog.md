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

---
Task ID: RESTRICTION-001
Agent: Main Agent
Task: ADD STRONG EDITING RESTRICTION — NEVER edit files outside the scope the user explicitly requests

Work Log:
- User reported that while working on WhatsApp section, other parts of the funnel (AudioCallScreen teleprompter) were accidentally affected
- Adding permanent restriction: ONLY edit files that the user explicitly asks about

Stage Summary:
- ⛔ CRITICAL RULE: When user says "edit WhatsApp section" → ONLY edit WhatsApp files
- ⛔ CRITICAL RULE: When user says "edit the call screen" → ONLY edit call screen files  
- ⛔ CRITICAL RULE: NEVER modify files outside the explicitly requested scope
- ⛔ Files that are LOCKED (Layers 1-6) must NEVER be touched unless explicitly requested
- ⛔ If a file change might affect other parts of the funnel, DO NOT make that change
- This restriction applies to ALL future interactions in this session

---

Task ID: LOCKSCREEN-001
Agent: Main Agent
Task: Create LockScreenNotification component + update FunnelOrchestrator + fix WhatsAppChat onComplete

Work Log:
- Created `/src/components/funnel/LockScreenNotification.tsx` — iOS-style lock screen with:
  - Full-screen wallpaper background (`/images/wallpaper-lock.jpg`) with dark overlay (rgba(0,0,0,0.5))
  - Real-time clock (HH:MM, Cinzel font, clamp(3rem, 12vw, 5rem), fontWeight 300)
  - Spanish date below clock (e.g., "lunes 18 de mayo"), opacity 0.7
  - WhatsApp notification card with green WA logo, "WhatsApp" bold, "ahora" timestamp
  - ZYRA profile pic (grayscale) + "ZYRA" bold + "Tengo algo para ti..." preview
  - Shimmer animation at subtle opacity
  - Tappable card → calls onOpen() (goToNextStep)
  - Vibration (150ms) on mount via navigator.vibrate
  - WhatsApp notification sound (`/audio/whatsapp-notification.aac`) on mount
  - Clock/date fade in at 0.3s delay; notification slides in at 1s with spring animation
- Updated `/src/components/funnel/FunnelOrchestrator.tsx`:
  - Imported LockScreenNotification and WhatsAppChat
  - Extended FunnelStep type: added 'lock_screen' | 'whatsapp_chat'
  - Extended stepOrder array: added 'lock_screen' and 'whatsapp_chat' after 'call_audio'
  - Added switch cases for new steps
  - Existing 4 steps remain untouched
- Fixed `/src/components/funnel/WhatsAppChat.tsx`:
  - Added `loginLoading` state
  - Added onClick handler to "Iniciar sesión" button
  - On click: sets loginLoading → true, disables button, changes text to "Ingresando...", removes shimmer/glow
  - After 2-second delay, calls onComplete() to transition to next funnel step

Stage Summary:
- Full funnel flow now: landing → pre_call_video → call_ringing → call_audio → lock_screen → whatsapp_chat
- Funnel no longer gets stuck after AudioCallScreen
- Lint: ✅ (0 errors, 1 pre-existing warning)
- Dev server: ✅ (compiling normally)
