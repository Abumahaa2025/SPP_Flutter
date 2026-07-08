/** Which bottom tab should appear active for a given route. */
export function resolveActiveTab(pathname: string): string {
  if (pathname === '/' || pathname === '/index') return 'home';
  if (pathname.startsWith('/brain')) return 'assistant';
  if (pathname.startsWith('/notifications')) return 'notifications';
  if (
    pathname.startsWith('/owner')
    || pathname.startsWith('/portfolio')
    || pathname.startsWith('/tenants')
    || pathname.startsWith('/contracts')
    || pathname.startsWith('/maintenance')
    || pathname.startsWith('/operational')
    || pathname.startsWith('/reports')
    || pathname.startsWith('/billing')
    || pathname.startsWith('/property/')
  ) return 'operations';
  if (
    pathname.startsWith('/hub')
    || pathname.startsWith('/settings')
    || pathname.startsWith('/setup')
    || pathname.startsWith('/profile')
    || pathname.startsWith('/support')
    || pathname.startsWith('/about')
    || pathname.startsWith('/guides')
    || pathname.startsWith('/upload')
  ) return 'more';
  return 'home';
}
