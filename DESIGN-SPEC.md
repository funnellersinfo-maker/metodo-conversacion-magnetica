# DESIGN SPEC — Metodo Magnetico Funnel
# ULTIMA ACTUALIZACION: 2026-05-18 (sesion 3)
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

### AudioCallScreen
- Teleprompter: timing ajustado — palabras se reparten en toda la duración del caption (no se corta al 80%)
- "Llamada finalizada": ahora es PANTALLA ROJA COMPLETA (gradiente #B71C1C → #D32F2F → #C62828)
- Ícono de teléfono colgado + duración + texto blanco
- Transición directa al quiz en 1.5s (sin fade to black intermedio)

### PreCallVideo
- Video reemplazado: "PRIMER VIDEO OFICIAL PRE LLAMADA CORTO.mp4"
- Comprimido de 7.7MB a 468KB (CRF 35, 480p, faststart)
- Inicia muteado para autoplay garantizado en móvil, intenta desmuteo automático

### FakeQuiz — DISEÑO NUEVO estilo CopyFilms
- Fondo negro sólido (#000000)
- Escudo rojo con check (shield icon) en rounded square
- "VERIFICACIÓN DE ACCESO" en rojo con líneas decorativas a los lados
- 3 preguntas FOMO nicho seducción:
  1. "¿Cuánto tiempo llevas usando los mismos mensajes que ella ya detecta?" (A/B/C)
  2. "¿Qué pasa cuando ella lee tu mensaje y no responde?" (A/B/C)
  3. "¿Estás listo para ver el sistema que ella no puede ignorar?" (A/B/C)
- NOTA: Solo se muestra la pregunta 1 (las 3 son el mismo botón — cualquiera avanza)
- Botones: fondo oscuro #222, borde blanco sutil, cuadrado rojo con letra A/B/C
- Al tocar CUALQUIER botón: quiz se vuelve 50% translúcido + aparece video payaso-vidrio.mp4 de fondo
- Video se reproduce completo de principio a fin
- Al acabar video: fondo semi-negro translúcido (70%) + botón rojo "CONTINUAR"
- Botón CONTINUAR avanza al siguiente paso (podcast)

### FunnelOrchestrator
- Reducido de 10 a 9 pasos (clown_short ahora está dentro del quiz)
- Paso 4 = FakeQuiz (incluye video payaso + botón CONTINUAR)
- Paso 5 = DantePodcast
- Paso 6 = ClownVideo completo (con sound prompt)

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
