"use client";

import { format } from "date-fns";
import {
	Building2,
	Calendar,
	CreditCard,
	FileText,
	Gift,
	Globe,
	Link as LinkIcon,
	Mail,
	MapPin,
	Pencil,
	Phone,
	RefreshCw,
	Save,
	TrendingUp,
	User,
	UserCircle2,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { crmApi } from "@/lib/api/crm";
import type { Lead } from "./types";

interface ViewLeadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	lead: Lead | null;
	onEdit?: () => void;
	onConvert?: () => void;
	onRefresh?: () => void;
}

export default function ViewLeadDialog({
	open,
	onOpenChange,
	lead,
	onEdit,
	onConvert,
	onRefresh,
}: ViewLeadDialogProps) {
	const [isEditingNotes, setIsEditingNotes] = useState(false);
	const [notesValue, setNotesValue] = useState(lead?.notes || "");
	const [isSavingNotes, setIsSavingNotes] = useState(false);

	useEffect(() => {
		if (lead) {
			setNotesValue(lead.notes || "");
			setIsEditingNotes(false);
		}
	}, [lead]);

	if (!lead) return null;

	const statusMap = {
		new: {
			label: "New",
			variant: "default" as const,
			color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
		},
		contacted: {
			label: "Contacted",
			variant: "secondary" as const,
			color:
				"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
		},
		qualified: {
			label: "Qualified",
			variant: "outline" as const,
			color:
				"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
		},
		proposal_sent: {
			label: "Proposal Sent",
			variant: "outline" as const,
			color:
				"bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
		},
		negotiation: {
			label: "Negotiation",
			variant: "secondary" as const,
			color:
				"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
		},
		won: {
			label: "Won",
			variant: "default" as const,
			color:
				"bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
		},
		lost: {
			label: "Lost",
			variant: "destructive" as const,
			color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
		},
	} as const;

	const sourceMap = {
		website: {
			label: "Website",
			icon: LinkIcon,
			variant: "default" as const,
			color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
		},
		social: {
			label: "Social Media",
			icon: Users,
			variant: "secondary" as const,
			color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
		},
		email: {
			label: "Email",
			icon: Mail,
			variant: "outline" as const,
			color:
				"bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
		},
		call: {
			label: "Phone Call",
			icon: Phone,
			variant: "outline" as const,
			color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
		},
		referral: {
			label: "Referral",
			icon: Gift,
			variant: "default" as const,
			color:
				"bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
		},
		other: {
			label: "Other",
			icon: TrendingUp,
			variant: "secondary" as const,
			color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
		},
	} as const;

	const status = statusMap[lead.status] || {
		label: lead.status,
		variant: "outline" as const,
		color: "",
	};
	const source = sourceMap[lead.source] || {
		label: lead.source,
		icon: TrendingUp,
		variant: "outline" as const,
		color: "",
	};
	const SourceIcon = source.icon || TrendingUp;

	const handleDoubleClickNotes = () => {
		setIsEditingNotes(true);
	};

	const handleSaveNotes = async () => {
		if (!lead) return;

		try {
			setIsSavingNotes(true);
			await crmApi.updateLead(lead.id, {
				notes: notesValue || undefined,
			});
			toast.success("Notes updated successfully");
			setIsEditingNotes(false);
			// Refresh data if callback is provided
			if (onRefresh) {
				onRefresh();
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An error occurred";
			toast.error(`Failed to update notes: ${errorMessage}`);
		} finally {
			setIsSavingNotes(false);
		}
	};

	const handleCancelNotes = () => {
		setNotesValue(lead.notes || "");
		setIsEditingNotes(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[616px] max-h-[85vh] flex flex-col p-0 [&>button]:hidden">
				{/* Header */}
				<div className="px-6 py-5 border-b shrink-0">
					<DialogHeader className="pb-0">
						<div className="flex items-start justify-between">
							<div className="space-y-2 flex-1">
								<DialogTitle className="text-2xl font-bold">
									{lead.title || lead.name}
								</DialogTitle>
								<DialogDescription className="text-sm">
									{lead.title ? (
										<span>
											<span className="text-muted-foreground">Contact: </span>
											{lead.name}
										</span>
									) : (
										"Lead Details & Information"
									)}
								</DialogDescription>
							</div>
							<div className="flex items-center gap-2">
								{onEdit && (
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => {
											onOpenChange(false);
											onEdit();
										}}
										title="Edit Lead"
									>
										<Pencil className="h-4 w-4" />
									</Button>
								)}
								{onConvert && (
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => {
											onOpenChange(false);
											onConvert();
										}}
										title="Convert to Customer"
									>
										<RefreshCw className="h-4 w-4" />
									</Button>
								)}
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={() => onOpenChange(false)}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</DialogHeader>
				</div>

				{/* Scrollable Content */}
				<div className="overflow-y-auto px-6 py-4 flex-1 min-h-0">
					{/* Status & Source Box */}
					<div className="rounded-lg border bg-card p-4 mb-4">
						<div className="grid grid-cols-2 gap-4 mb-4">
							{/* Status */}
							<div className="space-y-2">
								<div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
									<TrendingUp className="h-3 w-3" />
									Lead Status
								</div>
								<Badge
									variant={status.variant}
									className={`${status.color} text-xs font-semibold px-3 py-1.5 h-auto border-0`}
								>
									{status.label}
								</Badge>
							</div>

							{/* Source */}
							<div className="space-y-2">
								<div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
									<SourceIcon className="h-3 w-3" />
									Lead Source
								</div>
								<Badge
									variant={source.variant}
									className={`${source.color} text-xs font-semibold px-3 py-1.5 h-auto border-0 flex items-center gap-1.5 w-fit`}
								>
									<SourceIcon className="h-3 w-3" />
									{source.label}
								</Badge>
							</div>
						</div>

						{/* Estimated Value */}
						{lead.value && (
							<div className="pt-3 border-t">
								<div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
									<CreditCard className="h-3 w-3" />
									Estimated Value
								</div>
								<div className="flex items-baseline gap-2">
									<p className="text-lg font-bold text-primary">
										{new Intl.NumberFormat("en-US", {
											style: "currency",
											currency: "USD",
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										}).format(lead.value)}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Contact Information - First Row */}
					<div className="rounded-lg border bg-card p-4">
						<h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
							<UserCircle2 className="h-4 w-4" />
							Contact Information
						</h3>
						<div className="space-y-3">
							{lead.title && (
								<div>
									<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
										Lead Title
									</div>
									<p className="text-sm font-medium">{lead.title}</p>
								</div>
							)}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
										Contact Name
									</div>
									<p className="text-sm font-medium">{lead.name}</p>
								</div>
								<div>
									<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
										Email
									</div>
									<a
										href={`mailto:${lead.email}`}
										className="text-sm text-primary hover:underline block break-all"
									>
										{lead.email}
									</a>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								{lead.phone && (
									<div>
										<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
											Phone
										</div>
										<a
											href={`tel:${lead.phone}`}
											className="text-sm text-primary hover:underline inline-block"
										>
											{lead.phone}
										</a>
									</div>
								)}
								{lead.assignedTo && (
									<div>
										<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
											Assigned To
										</div>
										<p className="text-sm">{lead.assignedTo}</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Second Row - Timeline and other cards */}
					<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Timeline Card */}
						<div className="rounded-lg border bg-card p-4 md:col-span-2">
							<h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								Timeline
							</h3>
							<div className="space-y-6">
								{/* Timeline line with dots */}
								<div className="relative pt-4">
									{/* Horizontal line */}
									<div className="absolute top-6 left-0 right-0 h-0.5 bg-border"></div>

									{/* Timeline items */}
									<div className="relative grid grid-cols-2 gap-4">
										{/* Created At */}
										<div className="relative flex flex-col items-center">
											<div className="h-2.5 w-2.5 rounded-full bg-primary border-2 border-background mb-2 z-10"></div>
											<div className="text-center">
												<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
													Created At
												</div>
												<p className="text-xs font-medium">
													{format(new Date(lead.createdAt), "dd.MM.yyyy")}
												</p>
											</div>
										</div>

										{/* Last Updated */}
										<div className="relative flex flex-col items-center">
											<div className="h-2.5 w-2.5 rounded-full bg-primary border-2 border-background mb-2 z-10"></div>
											<div className="text-center">
												<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
													Last Updated
												</div>
												<p className="text-xs font-medium">
													{format(new Date(lead.updatedAt), "dd.MM.yyyy")}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						{/* Company Card */}
						{lead.company && (
							<div className="rounded-lg border bg-card p-4 md:col-span-2">
								<h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
									<Building2 className="h-4 w-4" />
									Company Information
								</h3>
								<div className="space-y-3">
									<div className="grid grid-cols-3 gap-4">
										<div>
											<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
												Company Name
											</div>
											<p className="text-sm">{lead.company}</p>
										</div>
										{lead.companyIndustry && (
											<div>
												<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
													Industry
												</div>
												<p className="text-sm">{lead.companyIndustry}</p>
											</div>
										)}
										{lead.companyType && (
											<div>
												<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
													Type
												</div>
												<p className="text-sm">{lead.companyType}</p>
											</div>
										)}
									</div>
									{lead.companyAddress && (
										<div>
											<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
												<MapPin className="h-3 w-3" />
												Address
											</div>
											<p className="text-sm">{lead.companyAddress}</p>
										</div>
									)}
									{lead.companySize && (
										<div className="grid grid-cols-2 gap-4">
											<div>
												<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
													Company Size
												</div>
												<p className="text-sm">{lead.companySize} employees</p>
											</div>
											{lead.companyWebsite && (
												<div>
													<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
														<Globe className="h-3 w-3" />
														Website
													</div>
													<a
														href={`https://${lead.companyWebsite}`}
														target="_blank"
														rel="noopener noreferrer"
														className="text-sm text-primary hover:underline inline-block"
													>
														{lead.companyWebsite}
													</a>
												</div>
											)}
										</div>
									)}
									<div className="grid grid-cols-2 gap-4">
										{lead.companyTaxId && (
											<div>
												<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
													<CreditCard className="h-3 w-3" />
													Tax ID
												</div>
												<p className="text-sm font-mono">{lead.companyTaxId}</p>
											</div>
										)}
										{lead.companyRegistrationNumber && (
											<div>
												<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
													<FileText className="h-3 w-3" />
													Registration Number
												</div>
												<p className="text-sm">
													{lead.companyRegistrationNumber}
												</p>
											</div>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Legal Representative Card */}
						{(lead.legalRepName ||
							lead.legalRepEmail ||
							lead.legalRepPhone) && (
							<div className="rounded-lg border bg-card p-4">
								<h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
									<User className="h-4 w-4" />
									Legal Representative
								</h3>
								<div className="space-y-3">
									{lead.legalRepName && (
										<div className="grid grid-cols-2 gap-4">
											<div>
												<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
													Name
												</div>
												<p className="text-sm">{lead.legalRepName}</p>
											</div>
											{lead.legalRepTitle && (
												<div>
													<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
														Title
													</div>
													<p className="text-sm">{lead.legalRepTitle}</p>
												</div>
											)}
										</div>
									)}
									{lead.legalRepEmail && (
										<div>
											<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
												Email
											</div>
											<a
												href={`mailto:${lead.legalRepEmail}`}
												className="text-sm text-primary hover:underline block break-all"
											>
												{lead.legalRepEmail}
											</a>
										</div>
									)}
									{lead.legalRepPhone && (
										<div>
											<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
												Phone
											</div>
											<a
												href={`tel:${lead.legalRepPhone}`}
												className="text-sm text-primary hover:underline inline-block"
											>
												{lead.legalRepPhone}
											</a>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Notes Card - Full Width */}
					<div className="mt-4 rounded-lg border bg-card p-4">
						<h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
							<FileText className="h-4 w-4" />
							Notes
						</h3>
						{isEditingNotes ? (
							<div className="space-y-3">
								<Textarea
									value={notesValue}
									onChange={(e) => setNotesValue(e.target.value)}
									placeholder="Enter notes..."
									className="min-h-[120px] resize-none"
									disabled={isSavingNotes}
								/>
								<div className="flex items-center justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={handleCancelNotes}
										disabled={isSavingNotes}
									>
										Cancel
									</Button>
									<Button
										size="sm"
										onClick={handleSaveNotes}
										disabled={isSavingNotes}
									>
										<Save className="h-3 w-3 mr-1.5" />
										{isSavingNotes ? "Saving..." : "Save"}
									</Button>
								</div>
							</div>
						) : (
							<button
								type="button"
								onDoubleClick={handleDoubleClickNotes}
								className="w-full text-left bg-muted/30 rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								title="Double click to edit"
							>
								{lead.notes ? (
									<p className="text-sm leading-relaxed whitespace-pre-wrap">
										{lead.notes}
									</p>
								) : (
									<p className="text-sm text-muted-foreground italic">
										No notes. Double click to add notes.
									</p>
								)}
							</button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
