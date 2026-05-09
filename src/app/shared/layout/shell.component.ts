import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';

import { ConversationStore } from '@core/services/conversation.store';
import { AgentService } from '@core/services/agent.service';
import { AuthService } from '@core/services/auth.service';
import { LumenLogoComponent } from './lumen-logo.component';

type Viewport = 'phone' | 'tablet' | 'desktop';

const PHONE_QUERY = '(max-width: 639.98px)';
const TABLET_QUERY = '(min-width: 640px) and (max-width: 1023.98px)';

@Component({
  selector: 'lm-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatRippleModule,
    LumenLogoComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements OnInit {
  private readonly convStore = inject(ConversationStore);
  private readonly agentSvc = inject(AgentService);
  private readonly auth = inject(AuthService);
  private readonly bpo = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly summaries = this.convStore.summaries;
  readonly activeId = this.convStore.activeId;
  readonly activeTitle = this.convStore.activeTitle;
  readonly agents = this.agentSvc.agents;
  readonly currentUser = this.auth.user;
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  readonly userInitial = computed(() => {
    const u = this.currentUser();
    if (!u) return '';
    const name = (u.username ?? u.email ?? '').trim();
    return name ? name.charAt(0).toUpperCase() : '·';
  });

  readonly viewport = signal<Viewport>('desktop');
  readonly sidebarOpen = signal(true);

  readonly isPhone = computed(() => this.viewport() === 'phone');
  readonly isTablet = computed(() => this.viewport() === 'tablet');
  readonly isDesktop = computed(() => this.viewport() === 'desktop');

  readonly isOverlay = computed(
    () => this.sidebarOpen() && this.viewport() !== 'desktop',
  );
  readonly isRail = computed(
    () =>
      !this.sidebarOpen() &&
      (this.viewport() === 'desktop' || this.viewport() === 'tablet'),
  );

  readonly recent = computed(() =>
    [...this.summaries()]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 12),
  );

  ngOnInit(): void {
    void this.convStore.loadSummaries();

    this.bpo
      .observe([PHONE_QUERY, TABLET_QUERY])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const next: Viewport = res.breakpoints[PHONE_QUERY]
          ? 'phone'
          : res.breakpoints[TABLET_QUERY]
            ? 'tablet'
            : 'desktop';
        if (next === this.viewport()) return;
        this.viewport.set(next);
        this.sidebarOpen.set(next === 'desktop');
      });

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.viewport() !== 'desktop') {
          this.sidebarOpen.set(false);
        }
      });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOverlay()) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  newChat(): void {
    this.convStore.startNewConversation();
    if (this.viewport() !== 'desktop') {
      this.sidebarOpen.set(false);
    }
  }

  selectConversation(id: string): void {
    this.convStore.setActive(id);
    if (this.viewport() !== 'desktop') {
      this.sidebarOpen.set(false);
    }
  }

  removeConversation(event: Event, id: string): void {
    event.stopPropagation();
    event.preventDefault();
    void this.convStore.deleteConversation(id);
  }

  agentLabel(agentId: string): string {
    return this.agentSvc.byId(agentId)?.name ?? '—';
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }

  goToRegister(): void {
    void this.router.navigate(['/register']);
  }

  logout(): void {
    this.auth.logout();
    this.convStore.clearActive();
    void this.router.navigate(['/chat']);
    void this.convStore.loadSummaries();
  }
}
