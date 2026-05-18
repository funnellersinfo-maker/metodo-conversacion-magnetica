# DESIGN SPEC — Metodo Magnetico Funnel
# ULTIMA ACTUALIZACION: 2026-05-18
# ARCHIVO DE MEMORIA: Si el chat se pierde, leer este archivo para saber el estado exacto del proyecto.

## PROYECTO
- Framework: Next.js 16 con App Router, static export
- Deploy: Cloudflare Pages — https://metodo-dante.pages.dev
- Token Cloudflare: cfut_sfEPDLSTiVcubCALuVlkCVCRrz77slooMiVJmdfp77b1f061
- Account ID: ca27cd4dfd78e516b45dc640b1196774
- Proyecto Cloudflare: metodo-dante
- Experiencia 100% mobile

## FLUJO DEL FUNNEL (10 PASOS)
0. CinematicLanding — Hook inicial con botón "ENTRAR EN LA EXPERIENCIA"
1. PreCallVideo — Video pre-llamada (dante-llamando.mp4)
2. CallHook — Pantalla de llamada entrante (swipe para contestar)
3. AudioCallScreen — Llamada con teleprompter + barras de frecuencia
4. FakeQuiz — Quiz falso (NECESITA RECONSTRUCCION — ver abajo)
5. ClownVideo corto — payaso-vidrio.mp4
6. DantePodcast — Podcast de Dante
7. ClownVideo completo — payaso-completo-final.mp4
8. LockScreenNotification — Notificación WhatsApp en pantalla de bloqueo
9. WhatsAppChat — Chat con audios + login TikTok

## ARCHIVOS PRINCIPALES
- src/app/page.tsx — Importa FunnelOrchestrator
- src/components/funnel/FunnelOrchestrator.tsx — State machine con stepIndex 0-9
- src/components/funnel/CinematicLanding.tsx — Hook
- src/components/funnel/PreCallVideo.tsx — Video pre-llamada
- src/components/funnel/CallHook.tsx — Llamada entrante
- src/components/funnel/AudioCallScreen.tsx — Llamada con teleprompter
- src/components/funnel/FakeQuiz.tsx — Quiz (PENDIENTE RECONSTRUIR)
- src/components/funnel/ClownVideo.tsx — Video payaso (reutilizable)
- src/components/funnel/DantePodcast.tsx — Podcast
- src/components/funnel/LockScreenNotification.tsx — Notif WhatsApp
- src/components/funnel/WhatsAppChat.tsx — Chat + TikTok

## MEDIOS
- /videos/dante-llamando.mp4 — Video pre-llamada (REEMPLAZADO 2026-05-18: "PRIMER VIDEO OFICIAL PRE LLAMADA CORTO.mp4" — 7.7MB)
- /videos/payaso-vidrio.mp4 — Payaso corto (12MB)
- /videos/payaso-completo-final.mp4 — Payaso completo comprimido (5.3MB, CRF 35, 480p)
- /audio/call-audio.mp3 — Audio de la llamada
- /audio/fondo-llamada.aac — Música fondo llamada (empieza seg 40)
- /audio/vibracion-celular.aac — Sonido vibración
- /audio/whatsapp-notification.aac — Notificación WhatsApp
- /audio/voice-1.mp3 hasta voice-5.mp3 — Voces WhatsApp
- /images/dante-profile.jpg — Foto perfil Dante
- /images/zyra-profile.jpg — Foto perfil Zyra (B&W en UI)
- /images/call-bg.png — Fondo pantalla llamada
- /images/wallpaper-lock.jpg — Wallpaper pantalla bloqueo
- /images/wallpaper-chat.jpg — Wallpaper chat WhatsApp

## COMPONENTES QUE NECESITAN RECONSTRUCCION
### FakeQuiz
- El usuario dice que el actual NO es su diseño original
- Su diseño tenía: video de fondo, al tocar botón se opacaba 50%, preguntas distintas con más sentido
- DETALLES PENDIENTES — esperar que el usuario describa exactamente cómo era

## ESTILO GENERAL
- Fuente: Cinzel (serif) — cargada via Google Fonts
- Color principal: #D32F2F (rojo) para hook, #4CAF50 (verde) para llamada
- Fondo oscuro: #0a0a0a
- Mobile-first, la experiencia es solo para móviles
- Animaciones: framer-motion
- Efectos: shimmer, glow, scan lines, film grain, vignette

## BUILD & DEPLOY
- Comando build: `bun run build` (genera /out)
- Deploy: `CLOUDFLARE_API_TOKEN=cfut_sfEPDLSTiVcubCALuVlkCVCRrz77slooMiVJmdfp77b1f061 npx wrangler pages deploy out --project-name=metodo-dante --commit-dirty=true`
- Limite Cloudflare: archivos < 25MB c/u
