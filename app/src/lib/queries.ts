import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export interface StackItem {
  id: string;
  peptideName: string;
  dose: number;
  unit: string;
  frequency: string;
  scheduleDays: number[];
  route: string | null;
  startedAt: string;
  cycleOnDays: number | null;
  cycleOffDays: number | null;
  archivedAt: string | null;
}

export function useStackItems() {
  return useQuery({
    queryKey: ["stackItems"],
    queryFn: () => api.get<StackItem[]>("/stack-items"),
  });
}

export function useCreateStackItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<StackItem, "id" | "startedAt" | "archivedAt">) =>
      api.post<StackItem>("/stack-items", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stackItems"] }),
  });
}

export function useArchiveStackItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/stack-items/${id}`, { archived: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stackItems"] }),
  });
}

export interface InjectionLog {
  id: string;
  stackItemId: string;
  site: string;
  takenAt: string;
  notes: string | null;
}

export function useInjectionLogs(stackItemId?: string) {
  return useQuery({
    queryKey: ["injectionLogs", stackItemId ?? "all"],
    queryFn: () =>
      api.get<InjectionLog[]>(
        `/injection-logs${stackItemId ? `?stackItemId=${stackItemId}` : ""}`,
      ),
  });
}

export function useLogInjection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { stackItemId: string; site: string; notes?: string }) =>
      api.post<InjectionLog>("/injection-logs", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["injectionLogs"] }),
  });
}

export interface Checkin {
  id: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  energy: number | null;
  mood: number | null;
  notes: string | null;
  createdAt: string;
  photos: { id: string; angle: string; url: string }[];
}

export function useCheckins() {
  return useQuery({
    queryKey: ["checkins"],
    queryFn: () => api.get<Checkin[]>("/checkins"),
  });
}

export function useCreateCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Omit<Checkin, "id" | "createdAt" | "photos">> & {
      photos?: { angle: string; url: string }[];
    }) => api.post<Checkin>("/checkins", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins"] }),
  });
}

export function useNutritionPlans() {
  return useQuery({
    queryKey: ["nutritionPlans"],
    queryFn: () => api.get("/nutrition/plans"),
  });
}
