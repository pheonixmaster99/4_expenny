'use client'

import DashboardToolbar from "@/components/DashboardToolbar"
import Login from "@/components/Login"
import SubscriptionForm from "@/components/SubscriptionForm"
import SubscriptionSummary from "@/components/SubscriptionSummary"
import SubscriptionsDisplay from "@/components/SubscriptionsDisplay"
import Toast from "@/components/Toast"
import UpcomingBills from "@/components/UpcomingBills"
import { useAuth } from "@/context/AuthContext"
import {
    convertSubscriptionsToCsv,
    emptySubscription,
    filterSubscriptions,
    getUpcomingBills,
    normalizeSubscription,
    parseCsvSubscriptions,
    sortSubscriptions,
} from "@/utils"
import { useEffect, useRef, useState } from "react"

const defaultFilters = {
    search: "",
    status: "All",
    category: "All",
    billingFrequency: "All",
    sortBy: "nextCharge",
}

export default function DashboardPage() {
    const { handleDeleteSubscription, handleReplaceSubscriptions, handleUpsertSubscription, userData, currentUser, loading } = useAuth()
    // Local UI state lives here because this page coordinates the full dashboard experience.
    const [isAddEntry, setIsAddEntry] = useState(false)
    const [formData, setFormData] = useState(emptySubscription)
    const [filters, setFilters] = useState(defaultFilters)
    const [toastMessage, setToastMessage] = useState("")
    const fileInputRef = useRef(null)
    const isAuthenticated = !!currentUser
    const subscriptions = userData?.subscriptions || []
    // Keep the raw Firebase data untouched and derive the dashboard view from filters + sorting.
    const filteredSubscriptions = sortSubscriptions(filterSubscriptions(subscriptions, filters), filters.sortBy)
    const upcomingBills = getUpcomingBills(subscriptions, 30)
    const isEditing = Boolean(formData.id)

    useEffect(() => {
        if (!toastMessage) {
            return
        }

        const timeoutId = window.setTimeout(() => setToastMessage(""), 2500)
        return () => window.clearTimeout(timeoutId)
    }, [toastMessage])

    function handleChangeInput(e) {
        const { name, value } = e.target
        // Use the input's "name" attribute as the key so one handler can manage the whole form.
        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    function handleEditSubscription(subscription) {
        // Reuse the same form for create and edit flows by hydrating it with the selected record.
        setFormData(normalizeSubscription(subscription))
        setIsAddEntry(true)
    }

    function handleResetForm() {
        setFormData(emptySubscription)
    }

    function handleToggleInput() {
        setIsAddEntry((previous) => !previous)
        if (isAddEntry) {
            setFormData(emptySubscription)
        }
    }

    async function handleSubmitSubscription() {
        if (!formData.name.trim() || !formData.startDate || Number(formData.cost) < 0) {
            setToastMessage("Please complete the required fields before saving.")
            return
        }

        await handleUpsertSubscription(formData)
        setToastMessage(isEditing ? "Subscription updated." : "Subscription added.")
        setFormData(emptySubscription)
        setIsAddEntry(false)
    }

    async function handleDelete(subscriptionId) {
        await handleDeleteSubscription(subscriptionId)
        setToastMessage("Subscription deleted.")
        if (formData.id === subscriptionId) {
            setFormData(emptySubscription)
            setIsAddEntry(false)
        }
    }

    function handleFilterChange(e) {
        const { name, value } = e.target
        // The toolbar uses the same pattern as the form: one generic handler updates any filter field.
        setFilters((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    function handleExport() {
        if (!subscriptions.length) {
            setToastMessage("Add subscriptions before exporting.")
            return
        }

        const csvContent = convertSubscriptionsToCsv(subscriptions)
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "expenny-subscriptions.csv"
        link.click()
        URL.revokeObjectURL(url)
        setToastMessage("CSV export is ready.")
    }

    async function handleImportFile(e) {
        const file = e.target.files?.[0]

        if (!file) {
            return
        }

        const text = await file.text()
        const importedSubscriptions = parseCsvSubscriptions(text)

        if (!importedSubscriptions.length) {
            setToastMessage("No valid subscriptions were found in that CSV file.")
            return
        }

        await handleReplaceSubscriptions([...subscriptions, ...importedSubscriptions])
        setToastMessage(`Imported ${importedSubscriptions.length} subscriptions.`)
        // Allow importing the same file again without forcing the user to rename it first.
        e.target.value = ""
    }

    if (loading) {
        return (
            <section className="card loading-shell">
                <h2>Loading your dashboard...</h2>
                <p>Pulling your subscriptions and analytics now.</p>
            </section>
        )
    }

    if (!isAuthenticated) {
        return <Login />
    }

    return (
        <>
            <Toast message={toastMessage} />

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden-input"
                onChange={handleImportFile}
            />

            <DashboardToolbar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={() => setFilters(defaultFilters)}
                onExport={handleExport}
                onImportClick={() => fileInputRef.current?.click()}
                onAdd={() => {
                    setFormData(emptySubscription)
                    setIsAddEntry(true)
                }}
            />

            <SubscriptionSummary subscriptions={subscriptions} />
            <UpcomingBills subscriptions={upcomingBills} />

            <SubscriptionsDisplay
                subscriptions={filteredSubscriptions}
                onAdd={() => {
                    setFormData(emptySubscription)
                    setIsAddEntry(true)
                }}
                onDelete={handleDelete}
                onEdit={handleEditSubscription}
            />

            {isAddEntry && (
                <SubscriptionForm
                    handleResetForm={handleResetForm}
                    closeInput={handleToggleInput}
                    formData={formData}
                    handleChangeInput={handleChangeInput}
                    onSubmit={handleSubmitSubscription}
                    isEditing={isEditing}
                />
            )}
        </>
    )
}
