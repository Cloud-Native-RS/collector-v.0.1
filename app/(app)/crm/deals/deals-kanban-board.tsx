"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { SearchIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import * as Kanban from "@/components/ui/kanban";
import { Progress } from "@/components/ui/progress";
import type { DealStage as ApiDealStage } from "@/lib/api/crm";
import { crmApi } from "@/lib/api/crm";
import { cn } from "@/lib/utils";

import type { Deal } from "./types";

interface DealsKanbanBoardProps {
	deals: Deal[];
	onRefresh?: () => void;
}

const stageMapping: Record<string, ApiDealStage> = {
	lead: "LEAD",
	qualified: "QUALIFIED",
	proposal: "PROPOSAL",
	negotiation: "NEGOTIATION",
	closed_won: "CLOSED_WON",
	closed_lost: "CLOSED_LOST",
};

const stageTitles: Record<string, string> = {
	lead: "Lead",
	qualified: "Qualified",
	proposal: "Proposal",
	negotiation: "Negotiation",
	closed_won: "Closed Won",
	closed_lost: "Closed Lost",
};

const stageColors: Record<string, string> = {
	lead: "bg-blue-500",
	qualified: "bg-green-500",
	proposal: "bg-yellow-500",
	negotiation: "bg-orange-500",
	closed_won: "bg-emerald-500",
	closed_lost: "bg-gray-400",
};

export default function DealsKanbanBoard({
	deals,
	onRefresh,
}: DealsKanbanBoardProps) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

	// Organize deals by stage
	const columnsData = React.useMemo(() => {
		const columns: Record<string, Deal[]> = {
			lead: [],
			qualified: [],
			proposal: [],
			negotiation: [],
			closed_won: [],
			closed_lost: [],
		};

		deals
			.filter((deal) => {
				if (!searchQuery) return true;
				const query = searchQuery.toLowerCase();
				return (
					deal.title.toLowerCase().includes(query) ||
					deal.dealNumber.toLowerCase().includes(query) ||
					deal.description?.toLowerCase().includes(query)
				);
			})
			.forEach((deal) => {
				if (columns[deal.stage]) {
					columns[deal.stage].push(deal);
				}
			});

		return columns;
	}, [deals, searchQuery]);

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		// Get deal ID - could be from active.id directly or from the deal object
		let dealId: string;
		if (typeof active.id === "string") {
			dealId = active.id;
		} else {
			const deal = deals.find((d) => d.id === active.id);
			if (!deal) return;
			dealId = deal.id;
		}

		// Find which column the item was dropped into
		const overId = over.id as string;

		// Check if dropped into a column (stage) or another item
		if (stageMapping[overId]) {
			// Dropped directly into a column
			const currentDeal = deals.find((d) => d.id === dealId);
			if (!currentDeal || currentDeal.stage === overId) return;

			try {
				setIsUpdating(dealId);
				const apiStage = stageMapping[overId];

				if (!apiStage) {
					throw new Error("Invalid stage");
				}

				await crmApi.updateDealStage(dealId, apiStage);
				toast.success("Deal stage updated successfully");

				if (onRefresh) {
					onRefresh();
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to update deal stage";
				toast.error(message);
			} finally {
				setIsUpdating(null);
			}
		} else {
			// Dropped on another item - find its column
			const targetDeal = deals.find((d) => d.id === overId);
			if (!targetDeal) return;

			const currentDeal = deals.find((d) => d.id === dealId);
			if (!currentDeal || currentDeal.stage === targetDeal.stage) return;

			try {
				setIsUpdating(dealId);
				const apiStage = stageMapping[targetDeal.stage];

				if (!apiStage) {
					throw new Error("Invalid stage");
				}

				await crmApi.updateDealStage(dealId, apiStage);
				toast.success("Deal stage updated successfully");

				if (onRefresh) {
					onRefresh();
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to update deal stage";
				toast.error(message);
			} finally {
				setIsUpdating(null);
			}
		}
	};

	const totalValue = (stageDeals: Deal[]) => {
		return stageDeals.reduce((sum, deal) => sum + deal.value, 0);
	};

	const weightedValue = (stageDeals: Deal[]) => {
		return stageDeals.reduce(
			(sum, deal) => sum + (deal.value * deal.probability) / 100,
			0,
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search deals..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			<Kanban.Root
				value={columnsData}
				onValueChange={() => {}} // Controlled by drag & drop
				getItemValue={(deal) => (typeof deal === "string" ? deal : deal.id)}
				onDragEnd={handleDragEnd}
			>
				<Kanban.Board className="flex w-full gap-4 overflow-x-auto pb-4">
					{Object.entries(columnsData).map(([stage, stageDeals]) => (
						<Kanban.Column
							key={stage}
							value={stage}
							className="w-[320px] min-w-[320px]"
						>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									<div
										className={cn("h-2 w-2 rounded-full", stageColors[stage])}
									/>
									<span className="text-sm font-semibold">
										{stageTitles[stage]}
									</span>
									<Badge variant="outline">{stageDeals.length}</Badge>
								</div>
							</div>

							{stageDeals.length > 0 && (
								<div className="mb-4 p-2 bg-muted rounded-md text-xs space-y-1">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Total Value:</span>
										<span className="font-medium">
											${totalValue(stageDeals).toLocaleString()}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Weighted Value:
										</span>
										<span className="font-medium">
											$
											{weightedValue(stageDeals).toLocaleString(undefined, {
												maximumFractionDigits: 0,
											})}
										</span>
									</div>
								</div>
							)}

							{stageDeals.length > 0 ? (
								<div className="flex flex-col gap-2 p-0.5">
									{stageDeals.map((deal) => (
										<Kanban.Item
											key={deal.id}
											value={deal.id}
											disabled={isUpdating === deal.id}
											asHandle
											asChild
										>
											<div
												className={cn(
													"rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer",
													isUpdating === deal.id && "opacity-50",
												)}
											>
												<div className="flex items-start justify-between mb-2">
													<div className="flex-1">
														<h4 className="font-medium text-sm mb-1 line-clamp-2">
															{deal.title}
														</h4>
														<p className="text-xs text-muted-foreground mb-2">
															{deal.dealNumber}
														</p>
													</div>
												</div>

												{deal.description && (
													<p className="text-xs text-muted-foreground mb-3 line-clamp-2">
														{deal.description}
													</p>
												)}

												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<span className="text-xs font-medium text-muted-foreground">
															Value
														</span>
														<span className="text-sm font-semibold">
															${deal.value.toLocaleString()}
														</span>
													</div>

													<div className="space-y-1">
														<div className="flex items-center justify-between">
															<span className="text-xs text-muted-foreground">
																Probability
															</span>
															<span className="text-xs font-medium">
																{deal.probability}%
															</span>
														</div>
														<Progress
															value={deal.probability}
															className="h-1.5"
														/>
													</div>

													{deal.expectedCloseDate && (
														<div className="flex items-center justify-between text-xs">
															<span className="text-muted-foreground">
																Expected Close
															</span>
															<span>
																{new Date(
																	deal.expectedCloseDate,
																).toLocaleDateString()}
															</span>
														</div>
													)}

													{deal.assignedTo && (
														<div className="flex items-center justify-between text-xs pt-1 border-t">
															<span className="text-muted-foreground">
																Assigned
															</span>
															<span className="font-medium">
																{deal.assignedTo}
															</span>
														</div>
													)}
												</div>
											</div>
										</Kanban.Item>
									))}
								</div>
							) : (
								<div className="flex flex-col justify-center gap-4 pt-4">
									<div className="text-muted-foreground text-sm text-center">
										No deals in this stage
									</div>
								</div>
							)}
						</Kanban.Column>
					))}
				</Kanban.Board>
				<Kanban.Overlay>
					<div className="bg-primary/10 size-full rounded-md" />
				</Kanban.Overlay>
			</Kanban.Root>
		</div>
	);
}
