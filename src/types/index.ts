export interface Category {
    id: string;
    name: string;
    icon?: string;
    created_at?: string;
}

export interface Subcategory {
    id: string;
    name: string;
    category_id: string;
    category?: Category;
    created_at?: string;
}

export interface Business {
    id: string;
    name: string;
    main_product?: string;
    description: string;
    address: string;
    delivery?: boolean;
    phone: string;
    whatsapp?: string;
    email: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    category_id: string;
    subcategory_id?: string;
    status: 'active' | 'inactive' | 'pending';
    image_url?: string;
    logo_url?: string;
    category?: Category;
    subcategory?: Subcategory;
    rating?: number;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    latitude?: number;
    longitude?: number;
    opening_hours?: string | { description?: string } | null;
    created_at?: string;
    updated_at?: string;
}

export interface BusinessImage {
    id: number | string;
    business_id: string;
    image_url: string;
    is_primary: boolean;
    created_at: string;
}

export interface Review {
    id: number | string;
    business_id: string;
    user_id: string;
    rating: number;
    content: string;
    created_at: string;
    user?: {
        id: string;
        name: string;
        username?: string;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    total?: number;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    avatar_url?: string;
    created_at?: string;
}

export interface ActivityItem {
    id: string;
    type: 'business' | 'category' | 'subcategory' | 'lead' | 'favorite';
    action: string;
    title: string;
    created_at: string;
    entity_id?: string;
}
