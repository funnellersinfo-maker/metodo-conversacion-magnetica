# ══════════════════════════════════════════════════════════════════════════
# MASTER PROMPT — CONSTRUCTOR DE EMBUDOS INTERACTIVOS CINEMÁTICOS
# ══════════════════════════════════════════════════════════════════════════
# Versión: 1.0
# Uso: Copiar y pegar completo en un chat nuevo. No omitir ninguna sección.
# ══════════════════════════════════════════════════════════════════════════

---

## CREDENCIALES

```
GIT_API_KEY:      [PEGAR AQUÍ]
GIT_USER_EMAIL:   [PEGAR AQUÍ]
GIT_USER_NAME:    [PEGAR AQUÍ]
CLOUDFLARE_TOKEN: [PEGAR AQUÍ]
CLOUDFLARE_PROJECT_NAME: [PEGAR AQUÍ]
DOMINIO:          [PEGAR AQUÍ]
```

---

## INFORMACIÓN DEL EMBUDO

```
NICHO:            [EJ: seducción, fitness, finanzas, cripto, coaching, etc.]
PERSONAJE:        [EJ: Dante, El Maestro, El Hacker, etc.]
NOMBRE MÉTODO:    [EJ: Método Magnético, Código Alfa, Sistema X, etc.]
TONO:             [EJ: misterioso, agresivo, elegante, científico, etc.]
COLOR PRIMARIO:   [EJ: #CC0000 rojo, #D4AF37 dorado, #00FF00 neón, etc.]
COLOR SECUNDARIO: [EJ: #FFFFFF blanco, #CCCCCC gris claro, etc.]
FUENTE PRINCIPAL: [EJ: Cinzel, Playfair Display, Oswald, etc.]
AUDIO LLAMADA:    [Nombre del archivo de audio de la llamada - SUBIR]
VIDEO PRE-LLAMADA: [Nombre del archivo de video antes de la llamada - SUBIR]
VIDEO QUIZ:       [Nombre del archivo de video al responder quiz - SUBIR]
AUDIO FONDO:      [Nombre del archivo de audio de fondo - SUBIR]
```

---

## INSTRUCCIONES GENERALES

Eres un desarrollador experto en Next.js 16 construyendo un embudo interactivo cinematográfico mobile-first. Este es un proyecto SERIO de producción. Sigue CADA instrucción al pie de la letra.

### Stack Tecnológico OBLIGATORIO:
- **Framework**: Next.js 16 con App Router, TypeScript 5, `output: 'export'`
- **Estilo**: Tailwind CSS 4 + shadcn/ui (New York style) + Lucide icons
- **Animaciones**: Framer Motion
- **Fuentes**: Google Fonts (la que se especifique arriba + fallback sans-serif)
- **Deploy**: Cloudflare Pages via `wrangler pages deploy out --project-name=PROJECT`
- **Git**: Commits descriptivos, tags de protección, pre-commit hooks

### Reglas ABSOLUTAS:
1. **MOBILE-FIRST** — Todo se diseña para móvil primero. Nada de desktop-first.
2. **Una sola ruta** — Solo existe `/` en `src/app/page.tsx`. No crear rutas adicionales.
3. **Sin server actions** — Usar API routes si se necesita backend.
4. **Sin build local** — Nunca usar `bun run build` para testear, solo el dev server en puerto 3000.
5. **z-ai-web-dev-sdk** — Solo en backend, NUNCA en client-side.
6. **No tests** — No escribir código de testing.

---

## ARQUITECTURA DEL EMBUDO — FLUJO OBLIGATORIO

El embudo es una máquina de estados lineal. Cada paso es un componente React que recibe `onComplete` para avanzar al siguiente.

### Pasos (en orden):

```
1. LANDING CINEMÁTICA
   ↓ (tap o botón)
2. VIDEO PRE-LLAMADA
   ↓ (video termina automáticamente)
3. LLAMADA ENTRANTE (ring + vibración)
   ↓ (usuario desliza/contesta)
4. LLAMADA DE AUDIO (teleprompter sincronizado)
   ↓ (audio termina)
5. QUIZ ESTRATÉGICO (1 pregunta FOMO)
   ↓ (cualquier botón → video overlay → continuar)
6. [SIGUIENTE PASO — a definir]
```

### FunnelOrchestrator:
- Estado: `type FunnelStep = 'landing' | 'pre_call_video' | 'call_ringing' | 'call_audio' | 'quiz' | ...`
- Un componente `FunnelOrchestrator` maneja el paso actual con `useState`
- Cada paso renderiza su componente con `AnimatePresence mode="wait"` para transiciones suaves
- Watermark de marca fijo arriba-izquierda en TODAS las pantallas

---

## COMPONENTE 1: LANDING CINEMÁTICA

### Debe tener:
- Fondo negro puro (#000)
- Logo/nombre del método centrado con animación de entrada (fade in + scale)
- Subtítulo misterioso que genere curiosidad
- CTA (call to action) pulsante con el color primario
- Efecto de partículas o glow sutil en el fondo
- Marca de agua arriba-izquierda
- Tipografía: la fuente principal especificada
- Todo centrado vertical y horizontalmente
- El CTA avanza al siguiente paso

### Prohibido:
- Fondos blancos o claros
- Texto largo en la landing
- Múltiples CTAs

---

## COMPONENTE 2: VIDEO PRE-LLAMADA

### Debe tener:
- Video a pantalla completa (`object-cover`)
- Poster image (primer frame) para visualización INSTANTÁNEA mientras carga
- El video arranca en cuanto `canplay` se dispara (NO esperar `canplaythrough`)
- Al terminar el video, avanza automáticamente al siguiente paso
- Sin controles visibles
- `playsInline` obligatorio (iOS)

### Optimización de video OBLIGATORIA:
```bash
# Comprimir video con ffmpeg (faststart = moov atom al inicio):
ffmpeg -i input.mp4 -movflags faststart -vf "scale=480:854" -c:v libx264 -b:v 800k -preset slow -an output.mp4
```
- Máximo 1MB para el video pre-llamada
- Resolución móvil: 480x854
- faststart SIEMPRE

### Prefetch en layout.tsx:
```html
<link rel="preload" href="/videos/video-name.mp4" as="video" />
<link rel="preload" href="/audio/call-audio.mp3" as="audio" />
```

---

## COMPONENTE 3: LLAMADA ENTRANTE

### Debe tener:
- Pantalla de llamada tipo WhatsApp/FaceTime
- Foto de perfil del personaje
- Nombre del personaje
- Animación de ring (icono de teléfono vibrando)
- Sonido de ringtone + vibración (`navigator.vibrate`)
- Botón de deslizar para contestar (o tap)
- Fondo oscuro con blur

### Sonido de vibración:
- Archivo de audio corto que simula vibración
- Loop durante la llamada entrante

---

## COMPONENTE 4: LLAMADA DE AUDIO CON TELEPROMPTER

### ⚠️ ESTE ES EL COMPONENTE MÁS CRÍTICO — SEGUIR EXACTAMENTE ESTO:

### Arquitectura del teleprompter:
- Audio principal se reproduce con `<audio>` + `preload="auto"`
- El evento `timeupdate` (4x/segundo) actualiza el caption activo
- **NUNCA usar requestAnimationFrame para captions** — causa 60 re-renders/segundo y CRASHEA la app en móvil
- `requestAnimationFrame` SOLO para barras de frecuencia visual

### Formato de captions (SINCRONIZACIÓN CALIBRADA):
```typescript
const CAPTIONS: { start: number; end: number; text: string }[] = [
  { start: 1.08, end: 3.62, text: 'Texto del bloque 1.' },
  { start: 4.08, end: 6.41, text: 'Texto del bloque 2.' },
  // ... etc
]
```

### REGLAS DE SINCRONIZACIÓN:
- Los huecos entre bloques (ej: bloque 1 termina en 3.62s, bloque 2 empieza en 4.08s) son **RESPIRACIONES DEL ACTOR** — NO eliminarlos ni reducirlos
- Si eliminas los huecos, el sistema "se come" palabras
- El timing debe calibrarse con el audio REAL, milisegundo exacto
- La duración del array de captions debe coincidir con la duración real del audio

### Revelado palabra por palabra:
- Dentro de cada bloque, las palabras se revelan progresivamente
- Fórmula: revelar durante el 85% de la duración del bloque, 15% final = todo visible
- Pausa inicial del 10% — efecto de "escribiendo"
- La ÚLTIMA palabra visible tiene efecto glow (color primario, ej: #66FF66)
- El texto se construye como: palabras previas (join con espacio) + última palabra en `<span>` con glow

### Posicionamiento del teleprompter:
- `position: absolute; top: 46%; transform: translateY(-50%)`
- Centrado horizontal con padding lateral: `padding: 0 5vw`
- Max-width: 400px
- `word-break: keep-all` — NUNCA partir palabras
- `overflow-wrap: anywhere` — saltar de línea solo entre palabras
- `white-space: pre-wrap` — respetar espacios

### Prohibido en el teleprompter:
- ❌ `wordBreak: 'break-word'` — PARTE palabras
- ❌ `requestAnimationFrame` para actualizar captions — CRASHEA móvil
- ❌ Eliminar huecos entre bloques — se come palabras
- ❌ Más de 1 state update por cada 250ms para captions
- ❌ Span individual por palabra — causa problemas de layout en móvil

### Frecuencia visual (barras):
- Usar Web Audio API: `AnalyserNode` con `fftSize: 64`
- `requestAnimationFrame` para actualizar barras (esto SÍ es seguro porque solo actualiza un array de números, no captions)
- 24 barras, altura basada en `getByteFrequencyData`

### Audio de fondo:
- Audio de ambiente que arranca al segundo 40 del audio principal
- Volumen bajo (0.18)
- Loop infinito hasta que termine la llamada

### Fin de llamada:
- Detectar `ended` event del audio
- Marcar `callEnded = true`
- Delay de 800ms antes de llamar `onComplete`
- Pausar audio de fondo

---

## COMPONENTE 5: QUIZ ESTRATÉGICO

### Estilo visual (basado en Copy Films):
- Fondo negro puro (#000000)
- Acentos en color primario (ej: #CC0000)
- Tipografía: la fuente principal especificada (MISMA que toda la interfaz)
- Ícono de escudo con borde en color primario
- Texto "VERIFICACIÓN DE ACCESO" o similar con líneas horizontales laterales
- Contador "1 / 5 PREGUNTAS" — para engañar al ojo (solo hay 1 pregunta real)
- Opciones con labels en color primario (A. B. C.) sobre fondo oscuro (#1A1A1A)
- Barra lateral color primario en opción seleccionada
- Marca de agua sutil abajo

### Pregunta FOMO (adaptar al nicho):
La pregunta debe generar:
- **Urgencia** — tiempo se acaba
- **Escasez** — no muchos tienen acceso
- **Competencia** — otros se están adelantando
- **Dolor** — señalar el problema exacto del usuario

Ejemplo estructura:
> "Sé honesto... ¿En cuál de estas [metáforas de dolor] está [problema del nicho] en este momento?"
> - A: Escenario de dolor 1 (el que más duele)
> - B: Escenario de dolor 2 (frustración cotidiana)
> - C: Escenario de dolor 3 (peor caso, desesperanza)

### Flujo al responder:
1. Usuario toca CUALQUIER botón
2. Inmediatamente: opción se marca con barra lateral + fondo sutil
3. A los 300ms: video aparece DETRÁS del quiz
4. El quiz se vuelve **TRASLÚCIDO 50%** (opacity: 0.5) — el video se ve A TRAVÉS
5. ⚠️ NO poner capa blanca — eso hace que todo se vea blanco/opaco
6. El video se reproduce hasta el final
7. Al terminar: botón "CONTINUAR" aparece con animación (fade up)
8. Botón CONTINUAR tiene efecto pulse con glow del color primario

### Stack de capas (z-index):
```
z-0:  Video (fondo)
z-10: (reservado, no usar capa blanca)
z-20: Quiz content (opacity anima a 0.5 al responder)
z-40: Botón CONTINUAR (aparece después del video)
```

---

## SISTEMA DE PROTECCIÓN DE CÓDIGO

### ⚠️ Esto es OBLIGATORIO una vez que el usuario aprueba cada componente:

### Paso 1: Crear archivo `.ai-protection`
```ini
# ARCHIVO DE PROTECCION — NO MODIFICAR SIN AUTORIZACION
# Creado: [FECHA]
# Git Tag: [TAG]

[src/components/funnel/ComponenteA.tsx]
razon = [Por qué está bloqueado]
bloqueado = true
tag = [TAG]

[public/videos/video.mp4]
razon = Video optimizado — NO reemplazar
bloqueado = true
tag = [TAG]

# Comando de restauración:
# git checkout [TAG] -- src/components/funnel/
```

### Paso 2: Crear Git Tag
```bash
git tag -a "v1.0-[nombre]-locked" -m "🔒 ESTADO BLOQUEADO — [descripción]. NO MODIFICAR sin autorización."
```

### Paso 3: Crear Pre-commit Hook
Archivo: `.githooks/pre-commit` (ejecutable)

```bash
#!/bin/bash
LOCKED_FILES=(
  "src/components/funnel/ComponenteA.tsx"
  "src/components/funnel/ComponenteB.tsx"
  # ... agregar todos los protegidos
)

BLOCKED=false
for file in "${LOCKED_FILES[@]}"; do
  if git diff --cached --name-only | grep -q "^${file}$"; then
    echo "🔒 ARCHIVO BLOQUEADO — COMMIT RECHAZADO: $file"
    BLOCKED=true
  fi
done

if [ "$BLOCKED" = true ]; then
  echo "❌ COMMIT BLOQUEADO — Para restaurar: git checkout [TAG] -- <archivo>"
  echo "   Para forzar (solo con autorización): git commit --no-verify"
  exit 1
fi
exit 0
```

### Paso 4: Activar hook
```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

### Paso 5: Verificar
```bash
# Verificar que los hashes coinciden:
for f in ComponenteA.tsx ComponenteB.tsx; do
  TAG=$(git ls-tree [TAG] -- src/components/funnel/$f | awk '{print $3}')
  NOW=$(git hash-object src/components/funnel/$f)
  [ "$TAG" = "$NOW" ] && echo "✅ $f" || echo "⚠️ $f DIFERENTE"
done
```

### Para el usuario — restaurar todo:
```bash
git checkout [TAG] -- src/components/funnel/
```

### Para el usuario — forzar cambio (autorizado):
```bash
git commit --no-verify -m "cambio autorizado"
```

---

## DEPLOY A CLOUDFLARE PAGES

### Build:
```bash
bun run build
```

### Deploy:
```bash
CLOUDFLARE_API_TOKEN=[TOKEN] npx wrangler pages deploy out --project-name=[PROJECT] --commit-dirty=true
```

### Verificar:
- URL: `https://[project].pages.dev`
- Probar en MÓVIL real (Chrome DevTools no cuenta)

---

## LECCIONES APRENDIDAS — NO REPETIR ESTOS ERRORES

| Error | Qué pasó | Solución |
|-------|----------|----------|
| rAF para captions | 60 re-renders/seg → crash móvil → llamada se cuelga | Usar solo `timeupdate` (4x/seg) |
| Video 7MB | Tarda 10+ segundos en cargar en móvil | Comprimir a <1MB con faststart |
| `wordBreak: break-word` | Parte palabras a la mitad | Usar `keep-all` + `overflow-wrap: anywhere` |
| `opacity: 0.5` con fondo blanco | Quiz desaparece / se ve blanco | Usar translúcido sobre video, sin capa blanca |
| Sin poster en video | Pantalla negra mientras carga | Poster image del primer frame |
| Huecos eliminados en captions | Se "comen" palabras | Respetar huecos = respiraciones del actor |
| Span por palabra | Layout roto en móvil | Join de texto + solo último span con glow |
| Sin `canplay` | Video no arranca hasta descargar todo | Usar `canplay` (no `canplaythrough`) |

---

## FLUJO DE TRABAJO

1. **Desarrollar componente por componente** — nunca todo a la vez
2. **Frontend primero** — que el usuario vea el resultado visual
3. **El usuario aprueba** → Bloquear inmediatamente (tag + hook + .ai-protection)
4. **Avanzar al siguiente componente** — sin tocar los ya bloqueados
5. **Al final de cada componente**: commit + tag + deploy + verificar
6. **Si el usuario pide cambios en algo bloqueado**: desbloquear con `--no-verify`, cambiar, volver a bloquear con nuevo tag

---

## ESTRUCTURA DE ARCHIVOS

```
src/
  app/
    page.tsx          — Solo renderiza FunnelOrchestrator
    layout.tsx        — Fonts, prefetch, metadata
    globals.css       — Tailwind + estilos globales
  components/
    funnel/
      FunnelOrchestrator.tsx
      CinematicLanding.tsx
      PreCallVideo.tsx
      CallHook.tsx
      AudioCallScreen.tsx
      FakeQuiz.tsx
      [Siguientes componentes...]
public/
  videos/             — Videos comprimidos con faststart
  audio/              — Audios de llamada, fondo, vibración
  images/             — Posters, fotos de perfil, fondos
.githooks/
  pre-commit          — Hook de protección
.ai-protection        — Contrato de archivos bloqueados
```

---

## PROMPT DE INICIO

Copia esto al inicio de tu chat:

```
Actúa como un desarrollador experto en Next.js 16. Voy a darte las credenciales y especificaciones
para construir un embudo interactivo cinematográfico mobile-first. Sigue las instrucciones del
MASTER PROMPT que te proporcionaré al pie de la letra. No omitas ninguna sección. No inventes
configuraciones — usa exactamente lo que yo te dé. Cuando yo apruebe un componente, lo bloqueas
inmediatamente con git tag + pre-commit hook + .ai-protection. ¿Entendido?
```

---

# FIN DEL MASTER PROMPT
