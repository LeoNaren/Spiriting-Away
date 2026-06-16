"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/data/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
        return () => unsubscribe();
    }, [])

    const getToken = async () => {
        if (!user) return null;
        return await user.getIdToken();
    };

    return (
        <AuthContext.Provider value={{user, getToken}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext); 