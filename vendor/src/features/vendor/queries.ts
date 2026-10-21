import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "./api/vendor";

export const q = {
  store: queryOptions({ queryKey: ["vendor", "store"], queryFn: api.getMyStore }),
  hours: queryOptions({ queryKey: ["vendor", "hours"], queryFn: api.getHours }),
  delivery: queryOptions({ queryKey: ["vendor", "delivery"], queryFn: api.getDelivery }),
  master: queryOptions({ queryKey: ["vendor", "master-products"], queryFn: api.getMasterProducts, staleTime: 5 * 60_000 }),
  categories: queryOptions({ queryKey: ["vendor", "categories"], queryFn: api.getCategories, staleTime: 5 * 60_000 }),
  units: queryOptions({ queryKey: ["vendor", "units"], queryFn: api.getUnits, staleTime: 5 * 60_000 }),
  products: queryOptions({ queryKey: ["vendor", "products"], queryFn: api.getStoreProducts }),
  inventory: queryOptions({ queryKey: ["vendor", "inventory"], queryFn: api.getInventory }),
  transactions: (id: string) => queryOptions({ queryKey: ["vendor", "transactions", id], queryFn: () => api.getTransactions(id) }),
  orders: queryOptions({ queryKey: ["vendor", "orders"], queryFn: api.getOrders }),
  order: (id: string) => queryOptions({ queryKey: ["vendor", "order", id], queryFn: () => api.getOrder(id) }),
};

/** Mutation that refreshes vendor data and shows a toast. */
export function useVendorMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>, success?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["vendor"] });
      if (success) toast.success(success);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
