import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "../services/api";

interface User {
    id: string;
    username: string;
    name?: string;
    email: string;
    role: "admin" | "operador" | "user";
    avatar_url?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStorageData = () => {
            const storedUser = localStorage.getItem("tem-aki-user");
            const storedToken = localStorage.getItem("tem-aki-token");

            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
            }
            setLoading(false);
        };

        loadStorageData();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem("tem-aki-token", token);
        localStorage.setItem("tem-aki-user", JSON.stringify(userData));
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("tem-aki-token");
        localStorage.removeItem("tem-aki-user");
        api.defaults.headers.common["Authorization"] = undefined;
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
