import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "@/lib/api/registry";
import type { Contact } from "@/app/(app)/crm/contacts-registry/types";
import { toast } from "sonner";

// Query keys for type-safe queries
export const contactKeys = {
  all: ["contacts"] as const,
  lists: () => [...contactKeys.all, "list"] as const,
  list: (filters: string) => [...contactKeys.lists(), { filters }] as const,
  details: () => [...contactKeys.all, "detail"] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
};

// Hook to fetch all contacts
export function useContacts() {
  return useQuery({
    queryKey: contactKeys.lists(),
    queryFn: async () => {
      const response = await customersApi.list();
      return response.data || [];
    },
  });
}

// Hook to fetch single contact
export function useContact(id: string | null) {
  return useQuery({
    queryKey: contactKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("Contact ID is required");
      const response = await customersApi.getById(id);
      return response.data;
    },
    enabled: !!id, // Only run query if id exists
  });
}

// Hook to create contact
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newContact: Partial<Contact>) => {
      const response = await customersApi.create(newContact);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch contacts list
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success("Contact created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create contact: ${error.message}`);
    },
  });
}

// Hook to update contact
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Contact>;
    }) => {
      const response = await customersApi.update(id, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.id),
      });
      toast.success("Contact updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });
}

// Hook to delete contact
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await customersApi.delete(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success("Contact deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    },
  });
}
