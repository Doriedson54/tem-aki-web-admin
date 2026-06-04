import api from "./api";
import type { Business, Category } from "../types";

export interface FavoriteItem {
    id: string;
    business_id: string;
    user_id: string;
    created_at: string;
    business: Business & { category: Category };
}

export const favoritesService = {
    getAll: async () => {
        const response = await api.get<{ success: boolean; data: FavoriteItem[] }>("/favorites");
        return response.data;
    },

    add: async (businessId: string) => {
        const response = await api.post<{ success: boolean; message: string }>("/favorites", { business_id: businessId });
        return response.data;
    },

    remove: async (businessId: string) => {
        const response = await api.delete<{ success: boolean; message: string }>(`/favorites/${businessId}`);
        return response.data;
    },

    check: async (businessId: string) => {
        const response = await api.get<{ success: boolean; is_favorite: boolean }>(`/favorites/check/${businessId}`);
        return response.data;
    }
};
