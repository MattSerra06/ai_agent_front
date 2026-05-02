import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@shared/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'chat' },
      {
        path: 'chat',
        loadComponent: () =>
          import('@features/chat/chat-page.component').then((m) => m.ChatPageComponent),
      },
      {
        path: 'chat/:sessionId',
        loadComponent: () =>
          import('@features/chat/chat-page.component').then((m) => m.ChatPageComponent),
      },
      {
        path: 'agents',
        loadComponent: () =>
          import('@features/agents/agents-page.component').then((m) => m.AgentsPageComponent),
      },
      {
        path: 'agents/new',
        loadComponent: () =>
          import('@features/agents/agent-editor.component').then((m) => m.AgentEditorComponent),
      },
      {
        path: 'agents/:id',
        loadComponent: () =>
          import('@features/agents/agent-editor.component').then((m) => m.AgentEditorComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'chat' },
];
