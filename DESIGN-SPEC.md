# DESIGN SPEC — Metodo Magnetico Funnel
# ULTIMA ACTUALIZACION: 2026-05-18 (sesion 4)
# ARCHIVO DE MEMORIA: Si el chat se pierde, leer este archivo para saber el estado exacto del proyecto.

## PROYECTO
- Framework: Next.js 16 con App Router, static export
- Deploy: Cloudflare Pages — https://metodo-dante.pages.dev
- Token Cloudflare: cfut_sfEPDLSTiVcubCALuVlkCVCRrz77slooMiVJmdfp77b1f061
- Account ID: ca27cd4dfd78e516b45dc640b1196774
- Proyecto Cloudflare: metodo-dante
- Experiencia 100% mobile

## FLUJO DEL FUNNEL (9 PASOS — actualizado)
0. CinematicLanding — Hook inicial con botón "ENTRAR EN LA EXPERIENCIA"
1. PreCallVideo — Video pre-llamada (dante-llamando.mp4, comprimido 468KB)
2. CallHook — Pantalla de llamada entrante (swipe para contestar)
3. AudioCallScreen — Llamada con teleprompter + barras de frecuencia
4. FakeQuiz — Quiz estilo CopyFilms con video payaso de fondo + botón CONTINUAR
5. DantePodcast — Podcast de Dante
6. ClownVideo completo — payaso-completo-final.mp4 (con prompt de sonido)
7. LockScreenNotification — Notificación WhatsApp en pantalla de bloqueo
8. WhatsAppChat — Chat con audios + login TikTok

## CAMBIOS DE ESTA SESION (2026-05-18)

### AudioCallScreen — SESION 4 FIX
- **Teleprompter REESCRITO**: Eliminado setInterval. Ahora es PURE TIME-BASED.
  - visibleWords se calcula directamente de `currentTime` vs caption start/end
  - Las palabras se revelan en el 80% de la duración del caption, 20% restante es tiempo de lectura
  - NUNCA se cortan: no hay interval que se pueda limpiar prematuramente
  - Buffer de +0.5s en `end` de cada caption para que no desaparezcan demasiado rápido
  - Buffer de -0.15s en `start` para que aparezcan ligeramente antes
- **Font size aumentado ~2%**: de `clamp(0.62rem, 2.4vw, 0.82rem)` a `clamp(0.632rem, 2.45vw, 0.836rem)`
- **Line height aumentado**: de 1.4 a 1.5 para mejor legibilidad
- Timestamps de captions ajustados con márgenes más amplios entre frases

### FakeQuiz — SESION 4 FIX
- **"1/5 PREGUNTAS"** añadido debajo de "VERIFICACIÓN DE ACCESO" — engaña al ojo
- **Botones funcionales tras inactividad**: 
  - Se usan refs (answeredRef) en vez de solo state para evitar stale closures
  - onComplete se mantiene en ref actualizado (onCompleteRef)
  - forceUpdate cada 30s previene que React pierda los event handlers
  - onClick y onTouchEnd ambos apuntan a handleAnswer con ref-based guard
- Al responder: toda la zona del quiz baja a opacity 0.5 (transition CSS 0.5s)

### Cambios anteriores (sesion 3)
- AudioCallScreen: "Llamada finalizada" = PANTALLA ROJA COMPLETA
- PreCallVideo: Video reemplazado y comprimido a 468KB
- FakeQuiz: Diseño CopyFilms + video payaso overlay + CONTINUAR
- FunnelOrchestrator: 9 pasos (clown_short dentro del quiz)

## ARCHIVOS PRINCIPALES
- src/app/page.tsx — Importa FunnelOrchestrator
- src/components/funnel/FunnelOrchestrator.tsx — State machine con stepIndex 0-8
- src/components/funnel/CinematicLanding.tsx — Hook
- src/components/funnel/PreCallVideo.tsx — Video pre-llamada (muteado, autoplay rápido)
- src/components/funnel/CallHook.tsx — Llamada entrante
- src/components/funnel/AudioCallScreen.tsx — Llamada con teleprompter + pantalla roja final
- src/components/funnel/FakeQuiz.tsx — Quiz CopyFilms + video payaso + CONTINUAR
- src/components/funnel/ClownVideo.tsx — Video payaso completo (reutilizable)
- src/components/funnel/DantePodcast.tsx — Podcast
- src/components/funnel/LockScreenNotification.tsx — Notif WhatsApp
- src/components/funnel/WhatsAppChat.tsx — Chat + TikTok

## MEDIOS
- /videos/dante-llamando.mp4 — Video pre-llamada (468KB, CRF 35, 480p, faststart)
- /videos/dante-llamando-original.mp4 — Original sin comprimir (7.7MB, backup)
- /videos/payaso-vidrio.mp4 — Payaso corto (12MB, usado dentro del quiz)
- /videos/payaso-completo-final.mp4 — Payaso completo comprimido (5.3MB, CRF 35, 480p)
- /audio/call-audio.mp3 — Audio de la llamada (68.28s)
- /audio/fondo-llamada.aac — Música fondo llamada (empieza seg 40)
- /audio/vibracion-celular.aac — Sonido vibración
- /audio/whatsapp-notification.aac — Notificación WhatsApp
- /audio/voice-1.mp3 hasta voice-5.mp3 — Voces WhatsApp
- /images/dante-profile.jpg — Foto perfil Dante
- /images/zyra-profile.jpg — Foto perfil Zyra (B&W en UI)
- /images/call-bg.png — Fondo pantalla llamada
- /images/wallpaper-lock.jpg — Wallpaper pantalla bloqueo
- /images/wallpaper-chat.jpg — Wallpaper chat WhatsApp

## ESTILO GENERAL
- Fuente: Cinzel (serif) — cargada via Google Fonts
- Color principal: #D32F2F (rojo) para hook/quiz, #4CAF50 (verde) para llamada
- Fondo oscuro: #0a0a0a (call), #000000 (quiz)
- Mobile-first, la experiencia es solo para móviles
- Animaciones: framer-motion
- Efectos: shimmer, glow, scan lines, film grain, vignette

## BUILD & DEPLOY
- Comando build: `bun run build` (genera /out)
- Deploy: `CLOUDFLARE_API_TOKEN=cfut_sfEPDLSTiVcubCALuVlkCVCRrz77slooMiVJmdfp77b1f061 npx wrangler pages deploy out --project-name=metodo-dante --commit-dirty=true`
- Limite Cloudflare: archivos < 25MB c/u
