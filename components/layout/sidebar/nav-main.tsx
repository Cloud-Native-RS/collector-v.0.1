"use client";

import {
	ArchiveRestoreIcon,
	BadgeDollarSignIcon,
	BrainCircuitIcon,
	ChartBarDecreasingIcon,
	ChartPieIcon,
	ChevronRight,
	CreditCardIcon,
	FolderDotIcon,
	type LucideIcon,
	MailIcon,
	MessageSquareIcon,
	PackageIcon,
	SettingsIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";

type NavGroup = {
	title: string;
	items: NavItem;
};

type NavItem = {
	title: string;
	href: string;
	icon?: LucideIcon;
	isComing?: boolean;
	isDataBadge?: string;
	isNew?: boolean;
	newTab?: boolean;
	items?: NavItem;
}[];

export const navItems: NavGroup[] = [
		{
			title: "Dashboard",
			items: [
				{
					title: "Overview",
					href: "/collector/dashboard",
					icon: BadgeDollarSignIcon,
				},
				{
					title: "Default",
					href: "/default",
					icon: ChartPieIcon,
				},
			],
		},
		{
			title: "Sales & Finance",
			items: [
				{
					title: "Accounts",
					href: "#",
					icon: CreditCardIcon,
					items: [
						{ title: "Contacts", href: "/crm/contacts-registry" },
						{ title: "Companies", href: "/crm/company-registry" },
					],
				},
				{
					title: "CRM",
					href: "#",
					icon: ChartBarDecreasingIcon,
					items: [
						{ title: "Leads", href: "/crm/leads" },
						{ title: "Deals", href: "/crm/deals" },
						{ title: "Pipelines", href: "/crm/pipelines" },
						{ title: "Activities", href: "/crm/activities" },
						{ title: "Reports", href: "/crm/reports" },
					],
				},
				// E-commerce removed
				{
					title: "Sales & Finance",
					href: "#",
					icon: BadgeDollarSignIcon,
					items: [
						{ title: "Dashboard", href: "/finance" },
						{ title: "Offers", href: "/sales/quotations" },
						{ title: "Orders", href: "/sales/orders" },
						{ title: "Invoices", href: "/sales/invoices" },
						{ title: "Payments", href: "/sales/payments" },
						{ title: "Contracts", href: "/sales/contracts" },
						{ title: "Price Lists", href: "/sales/price-lists" },
					],
				},
                {
                    title: "Inventory",
                    href: "#",
                    icon: PackageIcon,
                    items: [
                        { title: "Products & Services", href: "/inventory/products-services" },
                        { title: "Stock Management", href: "/inventory/stock-management" },
                        { title: "Warehouses", href: "/inventory/warehouses" },
                        { title: "Purchase Orders", href: "/inventory/purchase-orders" },
                        { title: "Suppliers / Vendors", href: "/inventory/suppliers" },
                        { title: "Delivery Notes", href: "/inventory/delivery-notes" },
                    ],
                },
			],
		},
		{
			title: "Operations",
			items: [
                {
                    title: "Project",
                    href: "/pages/projects",
                    icon: FolderDotIcon,
                    items: [
                        { title: "All Projects", href: "/pages/projects" },
                        { title: "Create Project", href: "/pages/projects/create" },
                        { title: "Kanban", href: "/apps/kanban" },
                        { title: "Tasks", href: "/apps/tasks" },
                        { title: "Calendar", href: "/apps/calendar" },
                    ],
                },
				{
					title: "HR & People",
					href: "#",
					icon: UsersIcon,
					items: [
						{ title: "Employees", href: "/hr/employees" },
						{ title: "Attendance", href: "/hr/attendance" },
						{ title: "Payroll", href: "/hr/payroll" },
						{ title: "Recruiting", href: "/hr/recruiting" },
					],
				},
                {
                    title: "File Manager",
                    href: "/apps/file-manager",
                    icon: ArchiveRestoreIcon,
                },
			],
		},
		{
			title: "Communication",
			items: [
				{
					title: "Chats",
					href: "/apps/chat",
					icon: MessageSquareIcon,
					isDataBadge: "5",
				},
				{ title: "Mail", href: "/apps/mail", icon: MailIcon },
				{
					title: "AI Chat V2",
					href: "/apps/ai-chat-v2",
					icon: BrainCircuitIcon,
				},
			],
		},
	{
		title: "Administration",
		items: [
			{
				title: "Settings",
				href: "/pages/settings",
				icon: SettingsIcon,
				items: [
					{ title: "Profile", href: "/pages/settings" },
					{ title: "User Management", href: "/pages/settings/users" },
					{ title: "Company Settings", href: "/pages/settings/company" },
					{ title: "Integrations", href: "/pages/settings/integrations" },
					{ title: "Service Audit", href: "/pages/settings/audit" },
					{ title: "Api Keys", href: "/apps/api-keys" },
				],
			},
		],
	},
];

export function NavMain() {
	const pathname = usePathname();
	const { isMobile } = useSidebar();

	return (
		<>
			{navItems.map((nav, navIndex) => (
				<SidebarGroup key={`nav-${nav.title}-${navIndex}`}>
					<SidebarGroupLabel>{nav.title}</SidebarGroupLabel>
					<SidebarGroupContent className="flex flex-col gap-2">
						<SidebarMenu>
							{nav.items.map((item, itemIndex) => (
								<SidebarMenuItem key={`item-${item.href}-${itemIndex}`}>
									{Array.isArray(item.items) && item.items.length > 0 ? (
										<>
											<div className="hidden group-data-[collapsible=icon]:block" suppressHydrationWarning>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<SidebarMenuButton tooltip={item.title}>
															{item.icon && <item.icon />}
															<span>{item.title}</span>
															<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
														</SidebarMenuButton>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														side={isMobile ? "bottom" : "right"}
														align={isMobile ? "end" : "start"}
														className="min-w-48 rounded-lg"
													>
														<DropdownMenuLabel>{item.title}</DropdownMenuLabel>
														{item.items?.map((subItem) => (
															<DropdownMenuItem
							className="hover:text-foreground active:text-foreground hover:bg-(--primary)/10! active:bg-(--primary)/10!"
																asChild
																key={subItem.href}
															>
																<a href={subItem.href}>{subItem.title}</a>
															</DropdownMenuItem>
														))}
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
											<div suppressHydrationWarning>
											<Collapsible className="group/collapsible block group-data-[collapsible=icon]:hidden">
												<CollapsibleTrigger asChild>
													<SidebarMenuButton
						className="hover:text-foreground active:text-foreground hover:bg-(--primary)/10 active:bg-(--primary)/10"
														tooltip={item.title}
													>
														{item.icon && <item.icon />}
														<span>{item.title}</span>
														<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
													</SidebarMenuButton>
												</CollapsibleTrigger>
												<CollapsibleContent>
													<SidebarMenuSub>
														{item?.items?.map((subItem) => (
															<SidebarMenuSubItem key={subItem.href}>
																<SidebarMenuSubButton
								className="hover:text-foreground active:text-foreground hover:bg-(--primary)/10 active:bg-(--primary)/10"
																	isActive={pathname === subItem.href}
																	asChild
																>
																	<Link
																		href={subItem.href}
																		target={subItem.newTab ? "_blank" : ""}
																	>
																		<span>{subItem.title}</span>
																	</Link>
																</SidebarMenuSubButton>
															</SidebarMenuSubItem>
														))}
													</SidebarMenuSub>
												</CollapsibleContent>
											</Collapsible>
											</div>
										</>
									) : (
										<SidebarMenuButton
						className="hover:text-foreground active:text-foreground hover:bg-(--primary)/10 active:bg-(--primary)/10"
											isActive={pathname === item.href}
											tooltip={item.title}
											asChild
										>
											<Link
												href={item.href}
												target={item.newTab ? "_blank" : ""}
											>
												{item.icon && <item.icon />}
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									)}
									{!!item.isComing && (
										<SidebarMenuBadge className="peer-hover/menu-button:text-foreground opacity-50">
											Coming
										</SidebarMenuBadge>
									)}
                                    
									{!!item.isDataBadge && (
										<SidebarMenuBadge className="peer-hover/menu-button:text-foreground">
											{item.isDataBadge}
										</SidebarMenuBadge>
									)}
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			))}
		</>
	);
}
