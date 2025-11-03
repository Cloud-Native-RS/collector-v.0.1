// Re-export Tenant interface from auth API
export type { Tenant } from '@/lib/api/auth';

/**
 * Get tenant by ID from cached user tenants
 */
export function getTenantById(id: string): Tenant | undefined {
  if (typeof window === 'undefined') return undefined;
  
  const cachedTenants = localStorage.getItem('userTenants');
  if (!cachedTenants) return undefined;
  
  try {
    const tenants: Tenant[] = JSON.parse(cachedTenants);
    return tenants.find(t => t.id === id);
  } catch {
    return undefined;
  }
}

/**
 * Get current tenant from localStorage
 */
export function getCurrentTenant(): Tenant | null {
  if (typeof window === 'undefined') return null;
  
  const tenantId = localStorage.getItem('tenantId');
  if (!tenantId) return null;
  
  return getTenantById(tenantId) || null;
}

/**
 * Set tenant - now uses API instead of mock data
 * This function is kept for backward compatibility but now uses switchTenant API
 */
export async function setTenant(tenantId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const { switchTenant } = await import('@/lib/api/auth');
    await switchTenant(tenantId);
    // switchTenant already updates localStorage, just reload
    window.location.reload();
  } catch (error) {
    console.error('Failed to switch tenant:', error);
    throw error;
  }
}

/**
 * Get all tenants - now uses API instead of mock data
 * This function is kept for backward compatibility but now uses getUserTenants API
 */
export async function getAllTenants(): Promise<Tenant[]> {
  if (typeof window === 'undefined') return [];
  
  try {
    const { getUserTenants } = await import('@/lib/api/auth');
    return await getUserTenants();
  } catch (error) {
    console.error('Failed to get tenants:', error);
    // Fallback to cached tenants
    const cachedTenants = localStorage.getItem('userTenants');
    if (cachedTenants) {
      try {
        return JSON.parse(cachedTenants);
      } catch {
        return [];
      }
    }
    return [];
  }
}

