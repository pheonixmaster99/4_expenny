'use client'

import { auth, db } from "@/firebase"
import { normalizeSubscription, normalizeSubscriptions } from "@/utils"
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext()

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider(props) {
    const { children } = props
    // This provider is the app's shared auth + subscription store.
    // Any component inside it can read the same user/session data with useAuth().
    const [currentUser, setCurrentUser] = useState(null)
    const [userData, setUserData] = useState({ subscriptions: [] })
    const [loading, setLoading] = useState(true)

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password)
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password)
    }

    async function logout() {
        setCurrentUser(null)
        setUserData({ subscriptions: [] })
        return signOut(auth)
    }

    async function saveToFirebase(subscriptions) {
        if (!currentUser) {
            return
        }

        try {
            const usersRef = doc(db, "users", currentUser.uid)
            await setDoc(
                usersRef,
                {
                    subscriptions: normalizeSubscriptions(subscriptions),
                },
                { merge: true }
            )
        } catch (err) {
            console.log(err.message)
            throw err
        }
    }

    async function handleUpsertSubscription(subscription) {
        const nextSubscription = normalizeSubscription(subscription)

        setUserData((previous) => {
            const subscriptions = previous?.subscriptions || []
            const existingIndex = subscriptions.findIndex((entry) => entry.id === nextSubscription.id)
            const updatedSubscriptions =
                existingIndex >= 0
                    ? subscriptions.map((entry, index) => (index === existingIndex ? nextSubscription : entry))
                    : [...subscriptions, nextSubscription]

            // Update the UI immediately, then persist the same result to Firestore in the background.
            void saveToFirebase(updatedSubscriptions)

            return {
                ...previous,
                subscriptions: updatedSubscriptions,
            }
        })
    }

    async function handleDeleteSubscription(subscriptionId) {
        setUserData((previous) => {
            const subscriptions = previous?.subscriptions || []
            const updatedSubscriptions = subscriptions.filter((subscription) => subscription.id !== subscriptionId)

            void saveToFirebase(updatedSubscriptions)

            return {
                ...previous,
                subscriptions: updatedSubscriptions,
            }
        })
    }

    async function handleReplaceSubscriptions(subscriptions) {
        // Used by CSV import to replace the current in-memory list with a freshly normalized one.
        const normalized = normalizeSubscriptions(subscriptions)
        setUserData((previous) => ({
            ...previous,
            subscriptions: normalized,
        }))
        await saveToFirebase(normalized)
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user)

            if (!user) {
                setUserData({ subscriptions: [] })
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const docRef = doc(db, "users", user.uid)
                const docSnap = await getDoc(docRef)
                const firebaseData = docSnap.exists() ? docSnap.data() : { subscriptions: [] }

                // Older records may not have ids/timestamps yet, so normalize everything on read.
                setUserData({
                    subscriptions: normalizeSubscriptions(firebaseData.subscriptions || []),
                })
            } catch (err) {
                console.log(err.message)
                setUserData({ subscriptions: [] })
            } finally {
                setLoading(false)
            }
        })

        return unsubscribe
    }, [])

    const value = {
        currentUser,
        userData,
        loading,
        signup,
        login,
        logout,
        handleUpsertSubscription,
        handleDeleteSubscription,
        handleReplaceSubscriptions,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
