import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "@/lib/api/crm";
import type { Deal } from "@/app/(app)/crm/deals/types";
import { toast } from "sonner";

// Query keys
export const dealKeys = {
  all: ["deals"] as const,
  lists: () => [...dealKeys.all, "list"] as const,
  list: (filters: string) => [...dealKeys.lists(), { filters }] as const,
  details: () => [...dealKeys.all, "detail"] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
};

// Hook to fetch all deals with caching
export function useDeals() {
  return useQuery({
    queryKey: dealKeys.lists(),
    queryFn: async () => {
      const response = await crmApi.getDeals();
      return response?.data || response || [];
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
}

// Hook to update deal stage with optimistic updates
export function useUpdateDealStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealId,
      stage,
    }: {
      dealId: string;
      stage: string;
    }) => {
      const response = await crmApi.updateDealStage(dealId, stage);
      return response.data;
    },
    // Optimistic update
    onMutate: async ({ dealId, stage }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dealKeys.lists() });

      // Snapshot previous value
      const previousDeals = queryClient.getQueryData(dealKeys.lists());

      // Optimistically update
      queryClient.setQueryData(dealKeys.lists(), (old: Deal[] | undefined) => {
        if (!old) return old;
        return old.map((deal) =>
          deal.id === dealId ? { ...deal, stage } : deal
        );
      });

      return { previousDeals };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(dealKeys.lists(), context.previousDeals);
      }
      toast.error("Failed to update deal stage");
    },
    // Refetch after success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success("Deal updated successfully");
    },
  });
}
