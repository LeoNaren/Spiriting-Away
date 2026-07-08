"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/data/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useCallback, useMemo } from "react";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (currentUser) => {
                setUser(currentUser);
                setIsLoading(false);
            },
            (err) => {
                setError(err);
                setIsLoading(false);
            }
        );
        return () => unsubscribe();
    }, [])

    const getToken = useCallback(async () => {
        if (!user) return null;
        try {
            return await user.getIdToken();
        } catch (err) {
            setError(err);
            return null;
        }
    }, [user]);

    const value = useMemo(
        () => ({ user, getToken, isLoading, error, isAuthenticated: !!user }),
        [user, isLoading, error, getToken]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext); 