import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { offersApi, type Offer } from "./offers";
import { toast } from "sonner";

// Query Keys
export const offerKeys = {
  all: ["offers"] as const,
  lists: () => [...offerKeys.all, "list"] as const,
  list: (filters?: any) => [...offerKeys.lists(), filters] as const,
  details: () => [...offerKeys.all, "detail"] as const,
  detail: (id: string) => [...offerKeys.details(), id] as const,
};

// Hooks

/**
 * Fetch all offers with optional filters
 */
export function useOffers(filters?: {
  customerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: offerKeys.list(filters),
    queryFn: async () => {
      const response = await offersApi.list(filters);
      return response.data || [];
    },
  });
}

/**
 * Fetch a single offer by ID
 */
export function useOffer(id: string, enabled = true) {
  return useQuery({
    queryKey: offerKeys.detail(id),
    queryFn: async () => {
      const response = await offersApi.getById(id);
      return response.data;
    },
    enabled: enabled && !!id,
  });
}

/**
 * Create a new offer
 */
export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: offersApi.create,
    onSuccess: (response) => {
      // Invalidate and refetch offers list
      queryClient.invalidateQueries({ queryKey: offerKeys.lists() });
      toast.success("Offer created successfully!");
      return response.data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create offer");
    },
  });
}

/**
 * Update an existing offer
 */
export function useUpdateOffer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: any) => offersApi.update(id, input),
    onSuccess: (response) => {
      // Invalidate both the list and the specific offer
      queryClient.invalidateQueries({ queryKey: offerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) });
      toast.success("Offer updated successfully!");
      return response.data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update offer");
    },
  });
}

/**
 * Send an offer
 */
export function useSendOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offersApi.send(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: offerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) });
      toast.success("Offer sent successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send offer");
    },
  });
}

/**
 * Approve an offer
 */
export function useApproveOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offersApi.approve(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: offerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) });
      toast.success("Offer approved!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve offer");
    },
  });
}

/**
 * Reject an offer
 */
export function useRejectOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offersApi.reject(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: offerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) });
      toast.success("Offer rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject offer");
    },
  });
}

/**
 * Clone an offer
 */
export function useCloneOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offersApi.clone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerKeys.lists() });
      toast.success("Offer cloned successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to clone offer");
    },
  });
}

/**
 * Cancel an offer
 */
export function useCancelOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offersApi.cancel(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: offerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) });
      toast.success("Offer cancelled");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel offer");
    },
  });
}

/**
 * Generate public token for an offer
 */
export function useGenerateOfferToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offersApi.generateToken(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate token");
    },
  });
}

/**
 * Convert offer to invoice
 */
export function useConvertOfferToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offersApi.convertToInvoice(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: offerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) });
      toast.success("Offer converted to invoice!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to convert to invoice");
    },
  });
}






