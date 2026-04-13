'use client'

import { useAuth } from "@/context/AuthContext"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

function LoginForm() {
    const params = useSearchParams()
    const isRegisterMode = params.get("register") === "true"
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isRegistration, setIsRegistration] = useState(isRegisterMode)
    const [error, setError] = useState(null)
    const [authenticating, setAuthenticating] = useState(false)
    const { signup, login } = useAuth()

    useEffect(() => {
        setIsRegistration(isRegisterMode)
    }, [isRegisterMode])

    async function handleAuthenticate(e) {
        e.preventDefault()

        if (!email || !email.includes("@") || password.length < 6 || authenticating) {
            setError("Enter a valid email and a password with at least 6 characters.")
            return
        }

        setError(null)
        setAuthenticating(true)

        try {
            if (isRegistration) {
                await signup(email, password)
            } else {
                await login(email, password)
            }
        } catch (err) {
            console.log(err.message)
            setError(err.message)
        } finally {
            setAuthenticating(false)
        }
    }

    return (
        <section className="login card">
            <p className="eyebrow">Account</p>
            <h2>{isRegistration ? "Create an account" : "Login to your dashboard"}</h2>
            <p>Save subscriptions to Firebase, sync them across devices, and start managing your recurring spending.</p>

            {error && (
                <div className="card">
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleAuthenticate} className="login-form">
                <label>
                    <span>Email</span>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
                </label>

                <label>
                    <span>Password</span>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" type="password" />
                </label>

                <button type="submit" disabled={authenticating}>
                    {authenticating ? "Submitting..." : isRegistration ? "Create account" : "Login"}
                </button>
            </form>

            <div className="full-line" />
            <div>
                <p>{isRegistration ? "Already have an account?" : "Need an account?"}</p>
                <button
                    type="button"
                    onClick={() => {
                        setIsRegistration((previous) => !previous)
                        setError(null)
                    }}
                >
                    {isRegistration ? "Log in instead" : "Create one"}
                </button>
            </div>
        </section>
    )
}

export default function Login() {
    return (
        <Suspense
            fallback={
                <section className="login card">
                    <h2>Loading account tools...</h2>
                </section>
            }
        >
            <LoginForm />
        </Suspense>
    )
}
