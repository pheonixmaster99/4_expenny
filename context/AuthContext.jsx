'use client'

import { auth, db } from "@/firebase"
import { subscriptions } from "@/utils"
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

// setup a hook, where the intention of the hook is that any component where we call this in, we're going to use the context function (useContext) and pass in the particular context. This will give us a global state.
export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider(props) {
    const { children } = props

    const [currentUser, setCurrentUser] = useState(null)
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(false)

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password)
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password)
    }

    function logout() {
        setCurrentUser(null)
        setUserData(null)
        return signOut(auth)
    }

    async function saveToFirebase(data) {
        try {
            const usersRef = doc(db, 'users', currentUser.uid)
            const res = await setDoc(usersRef, {
                subscriptions: data
            }, { merge: true} )

        } catch (err) {
            console.log(err.message)
        }

    }
    async function handleAddSubscription(newSubscription) {
        
        if (userData.subscriptions.length > 30) { return }
        // modify the local state (global context)
        // Ensure `subscriptions` stays an array by appending the new subscription to the existing array,
        // because the component expects an array for `.map()` and will break if it’s a single object.
        const newSubscriptions = [...userData.subscriptions, newSubscription]

        // Update the local state with the new subscriptions array while preserving other userData properties. 
        setUserData(prev => ({...prev, subscriptions: [...(prev.subscriptions || []), newSubscription],}));

        // setUserData({ subscriptions: newSubscription })
        
        // write the changes to our firbase database (asynchronous)
        await saveToFirebase(newSubscriptions)


    }

    async function handleDeleteSubscription(index) {
        // delete the entry at that index
        const newSubscriptions = userData.subscriptions.filter((val, valIndex) => {
            return valIndex != index
        })
        setUserData({ subscriptions: newSubscriptions })

        await saveToFirebase(newSubscriptions)
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async user => {
            try {
                setCurrentUser(user)

                if (!user) { return }


                // oh we found a user, let's check the database. 
                setLoading(true)
                const docRef = doc(db, 'users', user.uid)
                // Since we have a document Reference, let's see what the reference looks like and return that. 
                const docSnap = await getDoc(docRef)
                console.log('fetching user data')
                // let firebaseData = {subscriptions}
                let firebaseData = { subscriptions: []} // this is the default data for a new user

                // let firebaseData = { subscriptions: [] } // this is the default data for a new user
                if (docSnap.exists()) {
                    // oh we found data cool
                    console.log('Found user data')
                    firebaseData = docSnap.data()
                }
                setUserData(firebaseData)
                setLoading(false)
            } catch(err) {
                console.log(err.message)
            }
        })
        return unsubscribe
    }, [])
    // Value passed into the currentUser and other variables, and the creation of a corresponding key-value pair
    // The variables and functions in this object, are now accessible in any component via our global context. 
    const value = {
        currentUser, userData, loading, signup, login, logout, handleAddSubscription, handleDeleteSubscription
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )


}