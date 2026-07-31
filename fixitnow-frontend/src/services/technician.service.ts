import { api } from "@/lib/api";
import type { TechnicianProfile } from "@/types";

export interface GetTechniciansParams {
  searchTerm?: string;
  rating?: string;
  yearsOfExperience?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTechnicians {
  meta: { page: number; limit: number; total: number };
  data: TechnicianProfile[];
}

const buildParams = (params: GetTechniciansParams = {}) => {
  const search = new URLSearchParams();
  if (params.searchTerm) search.set("searchTerm", params.searchTerm);
  if (params.rating) search.set("rating", params.rating);
  if (params.yearsOfExperience)
    search.set("yearsOfExperience", params.yearsOfExperience);
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortOrder) search.set("sortOrder", params.sortOrder);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return search;
};

export const TechnicianService = {
  getAllTechnicians: async (
    params: GetTechniciansParams = {}
  ): Promise<PaginatedTechnicians> => {
    const qs = buildParams(params).toString();
    const res = await api.get(`/technicians${qs ? `?${qs}` : ""}`);
    return res.data?.data ?? res.data;
  },

  getTechnicianById: async (id: string) => {
    const res = await api.get(`/technicians/${id}`);
    return res.data?.data ?? res.data;
  },
};
