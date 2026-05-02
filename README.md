# Lumen — frontend Angular

Application web de chat et de configuration d'agents IA.
**Angular 21**, **Material 3** (theme custom *Aube*), **Tailwind v4**, **signals**, standalone components, zoneless.

---

## 🎨 Direction visuelle

Palette **Aube** — gris-bleu froid minéral, accent bleu acier, touches de rose oriental.
Pas de Material brut : tous les tokens M3 sont surchargés en CSS pour matcher l'identité.

- **Type** : Fraunces (titres, citations) · Inter Tight (UI) · JetBrains Mono (code)
- **Couleurs** : tokens `--lm-*` mappés sur `--mat-sys-*` et `@theme` Tailwind
- **Markdown IA** sans bulle (fond transparent), bulles uniquement côté utilisateur

---

## 🚀 Démarrage

```bash
# 1. Installer
npm install

# 2. Lancer le dev server (proxy → http://localhost:8080)
npm start

# 3. Ouvrir
open http://localhost:4200
```

Le proxy `proxy.conf.json` redirige `/api/*` vers `http://localhost:8080` —
adaptez-le si votre back Spring tourne ailleurs.

### Build prod

```bash
npm run build
# -> dist/lumen-web/
```

### Lint / format / test

```bash
npm run lint
npm run format
npm test
```

---

## 🔌 Branchement back Spring

L'app consomme directement les contrôleurs fournis :

| Méthode | Endpoint                     | Usage                                          |
|---------|------------------------------|------------------------------------------------|
| POST    | `/api/agent/config`          | Créer un agent (`AgentConfig` → `agentId`)     |
| GET     | `/api/agent/default`         | ID de l'agent par défaut                       |
| POST    | `/api/chat`                  | Stream SSE de la réponse (`text/event-stream`) |
| POST    | `/api/chat/sync`             | Réponse complète (fallback)                    |
| POST    | `/api/chat/stop`             | Interrompre la génération                      |
| POST    | `/api/conversation/new`      | Nouvelle session côté back                     |

**Streaming** : consommé via `fetch()` + `ReadableStream` dans `ChatService.stream()`.
Le parser SSE concatène les lignes `data:` et publie les chunks au composant.

**Catalogue d'agents** : le back ne propose pas de `GET /api/agents` ni de `DELETE`.
Le frontend mémorise donc les agents créés dans `localStorage` (`lumen.agents.v1`).
Étendre le service `AgentService` quand de nouveaux endpoints arriveront.

**Conversations** : également persistées en local (`lumen.conversations.v1`),
indexées par `sessionId`. Le back ne stocke que la session courante.

### Pointer vers une URL distante

Modifiez `src/environments/environment.ts` :

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://api.example.com',
};
```

L'interceptor `apiBaseUrlInterceptor` préfixe alors toutes les requêtes `/api/*`.

---

## 📁 Structure

```
src/
├─ app/
│  ├─ app.ts / app.config.ts / app.routes.ts
│  ├─ core/
│  │  ├─ http/                interceptors (base URL, erreurs)
│  │  ├─ models/              types DTO + UI (mappés sur les records Java)
│  │  └─ services/            ChatService (SSE), AgentService, ConversationStore, MarkdownService
│  ├─ shared/
│  │  ├─ layout/              ShellComponent (sidebar + outlet) + logo
│  │  └─ ui/                  MarkdownComponent, ConfirmDialogComponent
│  └─ features/
│     ├─ chat/                ChatPageComponent (streaming + composer)
│     └─ agents/              AgentsPageComponent (liste) + AgentEditorComponent
├─ environments/              environment.ts / .prod.ts
├─ styles.scss                Tailwind v4 + theme M3 + tokens Lumen
├─ index.html
└─ main.ts
```

---

## ⚙️ Choix techniques

- **Standalone components** partout (pas de `NgModule`)
- **Signals** (`signal`, `computed`, `effect`, `input.required()`, `output()`) — pas de RxJS pour l'état UI
- **Zoneless** (`provideZonelessChangeDetection()`) — perf + simplicité
- **Nouveau control flow** : `@if / @for / @switch`
- **Routing** : `loadComponent` lazy, `withComponentInputBinding()`, `withViewTransitions()`
- **HTTP** : `provideHttpClient(withFetch())` + interceptors fonctionnels
- **Material 3** : `mat.theme()` mixin + override des `--mat-sys-*` vers `--lm-*`
- **Tailwind v4** : config CSS-first dans `styles.scss` via `@theme`
- **Markdown** : `marked` + `DOMPurify` (sanitization stricte)

---

## 📦 Pousser sur GitHub

```bash
cd angular
git init
git add .
git commit -m "feat: initial Lumen frontend"
git branch -M main
git remote add origin git@github.com:VOUS/lumen-web.git
git push -u origin main
```

---

## 🛣️ Next steps suggérés

- Endpoint `GET /api/agents` côté Spring → retirer la persistance locale du catalogue
- Endpoint `GET /api/conversation/:id` → reprise de session côté back
- Auth (JWT bearer ou OIDC) → ajouter un `authInterceptor` dans `core/http/`
- Tests E2E (Playwright) sur les flows critiques (créer agent → envoyer message → stream)
- i18n (`@angular/localize`) si besoin multilingue
