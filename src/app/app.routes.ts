import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('@features/auth/login.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('@features/auth/register.component').then((m) => m.RegisterPageComponent),
  },
  {
    path: '',
    loadComponent: () => import('@shared/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'chat' },
      {
        path: 'conversations',
        loadComponent: () =>
          import('@features/conversations/conversations-list-page.component').then(
            (m) => m.ConversationsListPageComponent,
          ),
      },
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
      {
        path: 'admin',
        loadComponent: () =>
          import('@features/admin/admin-users-page.component').then(
            (m) => m.AdminUsersPageComponent,
          ),
      },
      {
        path: 'admin/users/:userId',
        loadComponent: () =>
          import('@features/admin/admin-user-conversations-page.component').then(
            (m) => m.AdminUserConversationsPageComponent,
          ),
      },
      {
        path: 'admin/users/:userId/conversations/:sessionId',
        loadComponent: () =>
          import('@features/admin/admin-conversation-detail-page.component').then(
            (m) => m.AdminConversationDetailPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'chat' },
];
