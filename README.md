# Marrakech - El Juego de Alfombras

Implementacion web del clasico juego de mesa **Marrakech**, donde los jugadores compiten como comerciantes de alfombras en el zoco de Marrakech. Coloca tus alfombras estrategicamente, controla el movimiento de Assam y cobra tributos a tus rivales.

Juega en modo local (2-4 jugadores en el mismo dispositivo) o en modo online con amigos en tiempo real.

## Reglas del juego

### Objetivo

Ser el comerciante mas rico al final de la partida. Tu puntuacion final es la suma de tus **dirhams** (monedas) mas el numero de **celdas visibles** de tus alfombras en el tablero.

### Flujo de un turno

Cada turno consta de tres fases:

1. **Orientar a Assam** — Elige hacia donde mirara Assam (izquierda, derecho o recto; nunca hacia atras)
2. **Lanzar el dado** — Un dado especial con caras `[1, 2, 2, 3, 3, 4]` determina cuantos pasos avanza Assam
3. **Colocar alfombra** — Coloca una alfombra de 2 celdas adyacente a la posicion de Assam

### Tributo

Si Assam cae sobre la alfombra de un rival, debes pagar un tributo igual al numero de celdas conectadas de ese color. Si no puedes pagar, quedas eliminado y tus alfombras se neutralizan (gris).

### Bordes del tablero

Cuando Assam llega al borde, da un giro en U. Si hay dos opciones posibles, el jugador elige la direccion.

### Fin de la partida

La partida termina cuando todos los jugadores colocan todas sus alfombras, o cuando solo queda un jugador activo.

| Jugadores | Alfombras por jugador | Dirhams iniciales |
|:---------:|:---------------------:|:-----------------:|
| 2         | 24                    | 30                |
| 3         | 15                    | 30                |
| 4         | 12                    | 30                |

## Stack tecnologico

| Tecnologia        | Uso                                    |
|-------------------|----------------------------------------|
| **Next.js 16**    | Framework full-stack con App Router    |
| **React 19**      | UI con componentes funcionales         |
| **TypeScript 5**  | Tipado estatico                        |
| **Tailwind CSS 4**| Estilos utility-first                  |
| **Zustand**       | Estado global del juego y lobby        |
| **Socket.IO**     | Comunicacion en tiempo real (online)   |
| **Framer Motion** | Animaciones (dado 3D, movimiento, UI)  |

## Inicio rapido

```bash
# Clonar el repositorio
git clone <repo-url>
cd marrakech

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

> El comando `dev` levanta un servidor HTTP personalizado con Socket.IO integrado mediante `tsx watch`, por lo que tanto el frontend como el backend de sockets corren en un solo proceso.

## Scripts disponibles

| Script          | Descripcion                                        |
|-----------------|----------------------------------------------------|
| `npm run dev`   | Servidor de desarrollo con hot reload              |
| `npm run build` | Build de produccion                                |
| `npm start`     | Servidor de produccion                             |
| `npm run lint`  | Ejecutar ESLint                                    |

## Estructura del proyecto

```
marrakech/
├── app/
│   ├── page.tsx                    # Lobby: menu, config local, config online, sala de espera
│   ├── game/
│   │   └── page.tsx                # Pagina principal del juego
│   ├── layout.tsx                  # Layout raiz (fuentes, metadata)
│   └── globals.css                 # Tema visual marroqui
│
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx           # Tablero 7x7 con celdas interactivas
│   │   ├── BoardCell.tsx           # Celda individual con textura de alfombra
│   │   ├── Assam.tsx               # Token de Assam con animacion de movimiento
│   │   ├── DiceOverlay.tsx         # Dado 3D con babuchas como caras
│   │   ├── PhaseControls.tsx       # Controles contextuales por fase
│   │   ├── PlayerPanel.tsx         # Panel de jugadores con stats
│   │   ├── PlayerCard.tsx          # Tarjeta de jugador (dirhams, alfombras, estado)
│   │   ├── GameHeader.tsx          # Encabezado con turno actual
│   │   ├── ActionLog.tsx           # Historial de acciones
│   │   ├── DirectionPicker.tsx     # Selector de orientacion de Assam
│   │   ├── TributeDisplay.tsx      # Visualizacion de pago de tributo
│   │   └── GameOverScreen.tsx      # Pantalla de resultados finales
│   │
│   ├── lobby/
│   │   ├── MainMenu.tsx            # Menu principal (Local / Online)
│   │   ├── LocalSetup.tsx          # Configuracion de partida local
│   │   ├── OnlineSetup.tsx         # Crear o unirse a sala online
│   │   ├── LobbyBackground.tsx     # Fondo animado con patron marroqui
│   │   └── PlayerConfig.tsx        # Input de nombre de jugador
│   │
│   └── ui/                         # Componentes base reutilizables
│
├── lib/
│   ├── game/
│   │   ├── engine.ts               # Motor de juego (orientar, mover, tributo, colocar)
│   │   ├── types.ts                # Tipos e interfaces del estado
│   │   ├── constants.ts            # Tablero, colores, dado, configuracion
│   │   ├── assam.ts                # Movimiento de Assam y logica de bordes
│   │   ├── carpet.ts               # Validacion de colocacion de alfombras
│   │   ├── tribute.ts              # Calculo de tributo (flood-fill)
│   │   ├── dice.ts                 # Dado con caras de animacion
│   │   └── scoring.ts              # Puntuacion final
│   │
│   ├── socket/
│   │   ├── server.ts               # Inicializacion Socket.IO y event handlers
│   │   └── roomManager.ts          # Gestion de salas, turnos y desconexiones
│   │
│   └── store/
│       ├── gameStore.ts            # Zustand: estado del juego
│       └── lobbyStore.ts           # Zustand: estado del lobby
│
├── hooks/
│   └── useMultiplayer.ts           # Hook de Socket.IO (singleton, callbacks)
│
└── server.ts                       # Servidor HTTP custom con Socket.IO
```

## Modos de juego

### Local

Todos los jugadores comparten el mismo dispositivo. Cada turno se controla manualmente — ideal para jugar en persona.

1. Seleccionar "Partida Local" en el menu
2. Elegir numero de jugadores (2-4) y asignar nombres
3. Jugar por turnos en la misma pantalla

### Online

Juega con amigos en tiempo real desde dispositivos separados.

1. **Crear sala** — Se genera un codigo de 6 caracteres (ej. `A3KX9R`)
2. **Compartir codigo** — Los demas jugadores lo ingresan para unirse
3. **Sala de espera** — Muestra jugadores conectados en tiempo real
4. **Iniciar** — Solo el creador puede iniciar cuando hay al menos 2 jugadores
5. **Jugar** — Las acciones se sincronizan via Socket.IO; solo puedes actuar en tu turno

#### Desconexion

Si un jugador se desconecta durante una partida online:
- Se marca como eliminado y sus alfombras se neutralizan (gris)
- Si era su turno, se avanza automaticamente al siguiente jugador
- Si solo queda un jugador activo, gana automaticamente

## Caracteristicas

- **Dado 3D** con babuchas marroquies como caras, animacion de giro y resultado
- **Tablero interactivo** con previsualización de alfombras, highlights de tributo y animacion de movimiento de Assam
- **Fases guiadas** — la interfaz muestra solo los controles relevantes para cada momento del turno
- **Historial de acciones** con iconos y scroll automatico
- **Pantalla de fin de partida** con tabla de puntuaciones, desglose de dirhams + celdas visibles
- **Indicador de turno** con "Tu" badge y animacion de espera para el turno del oponente
- **Tema visual marroqui** — paleta de arena, oro, terracotta y patrones geometricos
- **Responsive** — se adapta a desktop y dispositivos moviles

## Arquitectura online

```
Cliente A                    Servidor                   Cliente B
   │                           │                           │
   │── game:orient ──────────>│                           │
   │                           │── game:stateUpdate ────>│
   │<── game:stateUpdate ─────│                           │
   │                           │                           │
   │── game:roll ────────────>│                           │
   │                           │── game:diceRolled ─────>│
   │<── game:diceRolled ──────│                           │
   │                           │── game:stateUpdate ────>│  (encolado)
   │<── game:stateUpdate ─────│                           │
   │   (encolado hasta que     │                           │  (se aplica al
   │    termine animacion)     │                           │   terminar dado)
   │                           │                           │
   │── game:place ───────────>│                           │
   │                           │── game:stateUpdate ────>│
   │<── game:stateUpdate ─────│                           │
```

- Toda la logica del juego se ejecuta en el servidor para evitar trampas
- El dado se lanza en el servidor; los clientes solo reciben el resultado
- Los state updates durante la animacion del dado se encolan y se aplican al terminar la animacion, para que se vea el dado girar **antes** de que Assam se mueva

## Licencia

MIT
