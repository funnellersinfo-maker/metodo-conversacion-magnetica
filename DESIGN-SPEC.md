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

### AudioCallScreen — SESION 4 FIX DEFINITIVO
- **COPIE COMPLETO REESCRITO** con el texto EXACTO del guión de Dante (antes estaba truncado/inventado)
- **17 bloques con timestamps quirúrgicos** sincronizados al audio real (24fps timecode → segundos)
- **Los huecos entre bloques son INTENCIONALES** — coinciden con respiraciones/suspiros del actor
- **Teleprompter PURE TIME-BASED**: Eliminado setInterval. visibleWords se calcula de currentTime
- Las palabras se revelan en el 75% de la duración del caption, 25% es tiempo de lectura completo
- NUNCA se cortan: no hay interval que se pueda limpiar prematuramente
- SIN buffers artificiales — los timestamps son exactos
- **Font size aumentado ~2%**: `clamp(0.632rem, 2.45vw, 0.836rem)`
- **Line height**: 1.5 para mejor legibilidad
- audioDuration actualizado a 68.28s (último caption termina exactamente al final del audio)

#### COPIE EXACTO DE LA LLAMADA (17 bloques) — Calibrado a 68.28s:
```
 1. [0.83s - 2.63s]   Hey... no cuelgues.
 2. [3.21s - 5.42s]   Tienes suerte de haber atendido.
 3. [5.83s - 9.63s]   La mayoría de los hombres están ahí fuera, gritando por atención,
 4. [9.92s - 13.50s]  y tú... tú acabas de entrar en la frecuencia correcta.
 5. [14.08s - 17.42s] Hace años, la atracción era una especie de alquimia.
 6. [17.75s - 22.50s] Había misterio, había silencios que decían más que mil palabras.
 7. [22.83s - 24.50s] Pero algo se rompió.
 8. [24.83s - 29.42s] El mundo se llenó de plantillas baratas y frases de "copia y pega"
 9. [29.75s - 32.63s] que ella ya detecta en menos de 7 segundos.
10. [33.08s - 39.42s] Te has vuelto predecible, y en la biología del deseo, lo predecible es invisible.
11. [39.83s - 41.92s] Ella no te ignora porque no le gustes;
12. [42.21s - 46.08s] te ignora porque ya sabe exactamente qué vas a decir después.
13. [46.50s - 49.21s] Eres un eco más en su bandeja de entrada.
14. [49.63s - 55.42s] Pero escucha bien... porque lo que estoy a punto de revelarte es el cortocircuito.
15. [55.83s - 61.75s] Un sistema que ella no puede ignorar porque le habla directamente a su instinto, no a su lógica.
16. [62.42s - 64.08s] No cuelgues.
17. [64.50s - 68.28s] El primer capítulo está por desbloquearse.
```
Audio duration: 68.28s — último caption termina exactamente al final del audio.

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
