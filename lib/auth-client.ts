import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    // Use dynamic origin to avoid port mismatch issues
    baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
})

// Export useful hooks and methods
export const {
    signIn,
    signUp,
    signOut,
    useSession,
} = authClient;
