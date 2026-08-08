import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { type AuthUser, useAuthStore } from "../store/authStore";

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

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data: Partial<AuthUser>) => api.patch<AuthUser>("/auth/me", data),
    onSuccess: (user) => setUser(user),
  });
}

export type MacroConstraint = "max" | "min";

export interface MealIngredient {
  item: string;
  amount: string;
}

export interface BuiltMeal {
  title: string;
  ingredients: MealIngredient[];
  estimatedMacros: { calories: number; protein: number; carbs: number; fat: number };
  notes: string;
}

export interface BuildMealInput {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  caloriesConstraint: MacroConstraint;
  proteinConstraint: MacroConstraint;
  carbsConstraint: MacroConstraint;
  fatConstraint: MacroConstraint;
  priorityNutrients: string[];
  previousMeal?: { title: string; ingredients: MealIngredient[] };
  feedback?: string;
}

export function useBuildMeal() {
  return useMutation({
    mutationFn: (data: BuildMealInput) => api.post<BuiltMeal>("/meal-builder/generate", data),
  });
}
