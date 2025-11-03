"use client";

import * as React from "react";
import { Check, Building2, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getUserTenants, switchTenant, type Tenant } from "@/lib/api/auth";
import { useSidebar, SidebarMenuButton } from "@/components/ui/sidebar";
import { toast } from "sonner";
import CreateTenantDialog from "@/components/tenant/create-tenant-dialog";

export function TenantSwitcher() {
  const [open, setOpen] = React.useState(false);
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentTenantId, setCurrentTenantId] = React.useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  React.useEffect(() => {
    // Load tenants from API
    const loadTenants = async () => {
      try {
        const userTenants = await getUserTenants();
        setTenants(userTenants);
        
        // Get current tenant ID from localStorage
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId && userTenants.some(t => t.id === tenantId)) {
          setCurrentTenantId(tenantId);
        } else if (userTenants.length > 0) {
          // Use primary tenant or first tenant
          const primary = userTenants.find(t => t.isPrimary) || userTenants[0];
          setCurrentTenantId(primary.id);
          localStorage.setItem('tenantId', primary.id);
        }
      } catch (error) {
        console.error('Failed to load tenants:', error);
        toast.error('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
    
    // Listen for storage changes (when tenant is changed in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tenantId') {
        const newTenantId = e.newValue;
        if (newTenantId) {
          setCurrentTenantId(newTenantId);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const currentTenant = tenants.find(t => t.id === currentTenantId) || tenants[0];

  const handleSelect = async (tenant: Tenant) => {
    if (tenant.id === currentTenantId) {
      setOpen(false);
      return;
    }
    
    try {
      setLoading(true);
      await switchTenant(tenant.id);
      setCurrentTenantId(tenant.id);
      setOpen(false);
      // Reload page to apply tenant change
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to switch tenant:', error);
      toast.error(error.message || 'Failed to switch company');
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton
          tooltip={isCollapsed ? (currentTenant?.displayName || 'Company') : undefined}
          className="w-full justify-between hover:bg-[var(--primary)]/5 hover:text-foreground font-semibold"
        >
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate text-left">
                  {loading ? 'Loading...' : (currentTenant?.displayName || 'No company')}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </>
          ) : (
            <Building2 className="h-5 w-5" />
          )}
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0" align={isCollapsed ? "start" : "start"} side="right">
        <Command>
          <CommandInput placeholder="Pretraži kompanije..." />
          <CommandList>
            <CommandEmpty>Nijedna kompanija nije pronađena.</CommandEmpty>
            <CommandGroup>
              {loading ? (
                <CommandItem disabled>Loading companies...</CommandItem>
              ) : tenants.length === 0 ? (
                <CommandItem disabled>No companies available</CommandItem>
              ) : (
                tenants.map((tenant) => (
                  <CommandItem
                    key={tenant.id}
                    value={tenant.id}
                    onSelect={() => handleSelect(tenant)}
                    disabled={loading}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentTenantId === tenant.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Building2 className="mr-2 h-4 w-4" />
                    {tenant.displayName}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="border-t p-1">
          <Button
            variant="default"
            className="w-full justify-start gap-2"
            onClick={() => {
              setOpen(false);
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Company
          </Button>
        </div>
      </PopoverContent>
      <CreateTenantDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={async () => {
          // Reload tenants after creation
          try {
            const userTenants = await getUserTenants();
            setTenants(userTenants);
            const tenantId = localStorage.getItem('tenantId');
            if (tenantId && userTenants.some(t => t.id === tenantId)) {
              setCurrentTenantId(tenantId);
            } else if (userTenants.length > 0) {
              const primary = userTenants.find(t => t.isPrimary) || userTenants[0];
              setCurrentTenantId(primary.id);
              localStorage.setItem('tenantId', primary.id);
            }
          } catch (error) {
            console.error('Failed to reload tenants:', error);
          }
        }}
      />
    </Popover>
  );
}

