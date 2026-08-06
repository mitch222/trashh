# SupportGG

Análisis de partidas de League of Legends centrado en el rol de **support**:
comparación directa entre los dos supports de cada partida, estadísticas de
visión, y un minimapa con la línea de tiempo de la partida.

No está afiliado a Riot Games.

## Qué hace

- **Comparación de supports por partida** — healing a aliados, escudo, tiempo de
  control de masas, daño a campeones, visión y wards, lado a lado.
- **Minimapa con scrubber** — posiciones de los 10 campeones minuto a minuto,
  mapa de calor de presencia del support, estructuras con su estado real
  (torres, inhibidores, nexos) y los fosos de Barón y Dragón.
- **Feed de eventos** — cada asesinato, objetivo y ward de la partida; al elegir
  uno el mapa salta a ese momento.
- **Filtro por cola** — Clasificatoria Solo/Dúo, Flexible y Normal.

## Honestidad de los datos

Este proyecto no inventa datos que la API de Riot no publica. En concreto:

- Riot entrega **una posición por campeón cada 60 segundos**, y nada entre dos
  muestras. El mapa muestra posiciones puntuales, nunca recorridos, y jamás
  interpola.
- Riot **no publica la posición de las wards** (verificado sobre miles de
  eventos), así que este mapa nunca las dibuja espacialmente.
- Lo que sí es estimación va siempre etiquetado como tal: la visión activa y el
  estado de muerte de un campeón, porque Riot informa la muerte pero nunca la
  reaparición.
- Las coordenadas de torres, inhibidores y fosos están **derivadas de eventos
  reales** de Riot (`BUILDING_KILL` / `ELITE_MONSTER_KILL`), no copiadas de una
  wiki.

## Desarrollo

Requisitos: Node 22+ y una API key de Riot.

```bash
npm ci
cp .env.example .env.local   # y completá RIOT_API_KEY
npm run dev                  # http://localhost:5173
```

Por defecto el frontend consume la API ya desplegada, así que `npm run dev`
muestra datos reales sin más configuración.

### Trabajar sobre el backend

Las funciones de `api/` no corren con `vite`. Para ejecutarlas localmente:

```bash
npx vercel dev --listen 3001      # sirve /api/* con tu RIOT_API_KEY
npx vite --port 3000              # el frontend
```

y creá un `.env.development.local`:

```
VITE_API_URL=
VITE_DEV_API_PROXY=http://localhost:3001
```

Sin `VITE_DEV_API_PROXY` el proxy de `vite.config.js` apunta a producción y los
cambios de backend **no se ven** en desarrollo.

### Comprobaciones

```bash
npm run lint
npm run test        # unitarios (vitest)
npm run test:e2e    # end-to-end (playwright)
npm run ci          # las tres, en el orden de CI
```

## Seguridad

- Toda entrada que llega a una URL de Riot pasa por `shared/riotInput.js`, que
  valida contra listas permitidas. `region` se interpola en el *hostname*, así
  que sin esa validación un valor como `attacker.com//` convertía la API en un
  SSRF que filtraba la cabecera `X-Riot-Token`.
- La `RIOT_API_KEY` es de servidor: vive solo en `api/`, nunca en el bundle del
  cliente.
- Reportes de seguridad: abrí un issue sin incluir detalles explotables.

## Licencia

SupportGG no está avalado por Riot Games y no refleja sus opiniones. League of
Legends y Riot Games son marcas registradas de Riot Games, Inc.
