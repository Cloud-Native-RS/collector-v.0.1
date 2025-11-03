"use client";

import { Plus, ChevronsUpDown, Building2 } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import Logo from "@/components/layout/logo";
import { NavMain } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import { getUserTenants, switchTenant, getAuthToken, type Tenant } from "@/lib/api/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CreateTenantDialog from "@/components/tenant/create-tenant-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useIsTablet } from "@/hooks/use-mobile";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const { setOpen, setOpenMobile, isMobile } = useSidebar();
	const isTablet = useIsTablet();
	const [tenants, setTenants] = useState<Tenant[]>([]);
	const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
	const [loading, setLoading] = useState(true);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	// Track if component is mounted to avoid hydration mismatches
	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		// Load tenants from API - but wait a bit to ensure token is ready
		const loadTenants = async () => {
			// Wait 500ms to ensure token is available after login redirect
			await new Promise(resolve => setTimeout(resolve, 500));
			
			try {
				const userTenants = await getUserTenants();
				setTenants(userTenants);
				
				// Get current tenant from localStorage or use primary/first
				const tenantId = localStorage.getItem('tenantId');
				if (tenantId && userTenants.some(t => t.id === tenantId)) {
					const tenant = userTenants.find(t => t.id === tenantId);
					if (tenant) setCurrentTenant(tenant);
				} else if (userTenants.length > 0) {
					const primary = userTenants.find(t => t.isPrimary) || userTenants[0];
					setCurrentTenant(primary);
					localStorage.setItem('tenantId', primary.id);
				}
			} catch (error) {
				console.error('Failed to load tenants:', error);
				// Don't fail if tenants can't be loaded - use cached if available
				const cachedTenants = localStorage.getItem('userTenants');
				if (cachedTenants) {
					try {
						const parsed = JSON.parse(cachedTenants);
						setTenants(parsed);
					} catch {
						// Ignore parse errors
					}
				}
			} finally {
				setLoading(false);
			}
		};

		loadTenants();
		
		// Listen for storage changes
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'tenantId') {
				const newTenantId = e.newValue;
				if (newTenantId && tenants.length > 0) {
					const tenant = tenants.find(t => t.id === newTenantId);
					if (tenant) setCurrentTenant(tenant);
				}
			}
		};
		
		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, [tenants]);

	useEffect(() => {
		if (isMobile && pathname) {
			setOpenMobile(false);
		}
	}, [pathname, isMobile, setOpenMobile]);

	useEffect(() => {
		setOpen(!isTablet);
	}, [isTablet, setOpen]);

	return (
		<Sidebar collapsible="icon" {...props} suppressHydrationWarning>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<div suppressHydrationWarning>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton className="hover:text-foreground h-10 group-data-[collapsible=icon]:px-0! hover:bg-[var(--primary)]/5">
									<Logo />
									<span 
										className="font-semibold group-data-[collapsible=icon]:hidden"
										suppressHydrationWarning
									>
										{mounted ? (loading ? 'Loading...' : (currentTenant?.displayName || 'No company')) : 'Loading...'}
									</span>
									<ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="mt-4 w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
								side={isMobile ? "bottom" : "right"}
								align="end"
								sideOffset={4}
								suppressHydrationWarning
							>
								<DropdownMenuLabel>Kompanije</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{loading ? (
									<DropdownMenuItem disabled>Loading...</DropdownMenuItem>
								) : tenants.length === 0 ? (
									<DropdownMenuItem disabled>No companies available</DropdownMenuItem>
								) : (
									tenants.map((tenant) => (
										<DropdownMenuItem 
											key={tenant.id}
											className="flex items-center gap-3"
											onClick={async () => {
												try {
													if (tenant.id === currentTenant?.id) return;
													await switchTenant(tenant.id);
													// Reload page to apply tenant change
													window.location.reload();
												} catch (error: any) {
													console.error('Failed to switch tenant:', error);
													toast.error(error.message || 'Failed to switch company');
												}
											}}
										>
											<div className="flex size-8 items-center justify-center rounded-md border">
												<Building2 className="text-muted-foreground size-4" />
											</div>
											<div className="flex flex-col">
												<span className="text-sm font-medium">{tenant.displayName}</span>
												<span className={cn(
													"text-xs",
													currentTenant?.id === tenant.id ? "text-green-700" : "text-muted-foreground"
												)}>
													{currentTenant?.id === tenant.id ? "Aktivna" : "Prebaci"}
												</span>
											</div>
										</DropdownMenuItem>
									))
								)}
								<DropdownMenuSeparator />
								<div className="p-1">
									<Button
										variant="default"
										className="w-full justify-start gap-2"
										onClick={() => setIsCreateDialogOpen(true)}
									>
										<Plus className="size-4" />
										New Company
									</Button>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<ScrollArea className="h-full">
					<NavMain />
				</ScrollArea>
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
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
							const tenant = userTenants.find(t => t.id === tenantId);
							if (tenant) setCurrentTenant(tenant);
						} else if (userTenants.length > 0) {
							const primary = userTenants.find(t => t.isPrimary) || userTenants[0];
							setCurrentTenant(primary);
							localStorage.setItem('tenantId', primary.id);
						}
					} catch (error) {
						console.error('Failed to reload tenants:', error);
					}
				}}
			/>
		</Sidebar>
	);
}
