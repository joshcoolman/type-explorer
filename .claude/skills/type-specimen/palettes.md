# Palettes — accent + mood per pairing

Each palette is a pair of token sets (light `:root`, dark `.dark`) using the same
variable names as `template.html`. Values are HSL **channels** (no `hsl()`
wrapper), consumed as `hsl(var(--token))`. Pick the mood that suits the fonts,
then drop the values into the template's `:root` and `.dark` blocks. Adjust
`--signal` last — it's the single accent on numbers, hover, links, and rules.

Only the mood/accent tokens are shown below. Keep the remaining tokens
(`--card`, `--muted`, `--ring`, `--radius`, etc.) from the template; let
`--card`/`--muted` track `--background`/`--foreground` as the template already
does. Keep body/foreground contrast at AA or better.

## Choosing
- Warm, old-style, high-contrast serifs (Fraunces, Playfair, Cormorant) →
  **Warm editorial** or **Oxblood**.
- Cool, rational, modern faces (IBM Plex, Source, grotesques, Newsreader) →
  **Cool ink** or **Slate**.
- Technical / monospace / brutalist pairings (Space Grotesk + mono) →
  **Mono terminal** or **Signal green**.
- Soft, humanist, friendly pairings → **Sage** or **Warm editorial**.

Blend freely; these are starting points, not rules.

---

### Warm editorial  (paper + vermilion) — the template default
```
:root  --background: 42 38% 97%;  --foreground: 30 9% 11%;
       --muted-foreground: 30 5% 40%;  --border: 34 14% 84%;
       --signal: 8 76% 49%;  --signal-foreground: 42 38% 97%;
.dark  --background: 30 8% 7%;   --foreground: 40 24% 91%;
       --muted-foreground: 38 8% 60%;  --border: 34 7% 18%;
       --signal: 10 84% 60%;  --signal-foreground: 30 8% 7%;
```

### Oxblood  (cream + deep red)
```
:root  --background: 36 30% 96%;  --foreground: 350 12% 12%;
       --muted-foreground: 350 6% 40%;  --border: 350 12% 86%;
       --signal: 348 64% 40%;  --signal-foreground: 36 30% 96%;
.dark  --background: 350 12% 7%;  --foreground: 36 24% 90%;
       --muted-foreground: 350 8% 60%;  --border: 350 10% 18%;
       --signal: 348 70% 56%;  --signal-foreground: 350 12% 7%;
```

### Cool ink  (porcelain + indigo)
```
:root  --background: 210 30% 98%;  --foreground: 222 22% 12%;
       --muted-foreground: 220 10% 42%;  --border: 216 18% 86%;
       --signal: 232 64% 52%;  --signal-foreground: 210 30% 98%;
.dark  --background: 224 22% 8%;   --foreground: 210 24% 92%;
       --muted-foreground: 218 12% 62%;  --border: 222 14% 20%;
       --signal: 230 80% 68%;  --signal-foreground: 224 22% 8%;
```

### Slate  (neutral gray + steel blue)
```
:root  --background: 210 16% 97%;  --foreground: 215 18% 14%;
       --muted-foreground: 215 8% 44%;  --border: 214 12% 85%;
       --signal: 205 70% 42%;  --signal-foreground: 210 16% 97%;
.dark  --background: 215 16% 9%;   --foreground: 210 18% 90%;
       --muted-foreground: 214 10% 60%;  --border: 215 10% 20%;
       --signal: 200 80% 58%;  --signal-foreground: 215 16% 9%;
```

### Mono terminal  (off-white + near-black, sharp)
```
:root  --background: 60 6% 96%;   --foreground: 0 0% 8%;
       --muted-foreground: 0 0% 40%;  --border: 0 0% 84%;
       --signal: 0 0% 8%;  --signal-foreground: 60 6% 96%;
.dark  --background: 0 0% 6%;     --foreground: 0 0% 92%;
       --muted-foreground: 0 0% 56%;  --border: 0 0% 18%;
       --signal: 0 0% 92%;  --signal-foreground: 0 0% 6%;
```
(For mono, consider a colored `--ring`/selection if you want one spark of hue.)

### Signal green  (paper + phosphor)
```
:root  --background: 90 14% 97%;   --foreground: 130 12% 10%;
       --muted-foreground: 130 6% 38%;  --border: 110 12% 84%;
       --signal: 146 64% 32%;  --signal-foreground: 90 14% 97%;
.dark  --background: 140 12% 6%;   --foreground: 100 16% 90%;
       --muted-foreground: 120 8% 58%;  --border: 135 10% 18%;
       --signal: 142 70% 52%;  --signal-foreground: 140 12% 6%;
```

### Sage  (warm green-gray + terracotta)
```
:root  --background: 80 16% 96%;   --foreground: 90 10% 14%;
       --muted-foreground: 90 6% 40%;  --border: 90 12% 84%;
       --signal: 18 62% 48%;  --signal-foreground: 80 16% 96%;
.dark  --background: 100 8% 8%;    --foreground: 80 14% 90%;
       --muted-foreground: 90 8% 58%;  --border: 95 8% 19%;
       --signal: 20 70% 60%;  --signal-foreground: 100 8% 8%;
```

---

## Always set, regardless of palette
- `--ring` usually matches `--signal`.
- `--card` / `--muted` can track `--background` (a hair lighter/darker).
- Keep `--radius` small (`0.25rem`) — the specimen aesthetic is crisp, not candy.
- `::selection` already uses `--signal`.
