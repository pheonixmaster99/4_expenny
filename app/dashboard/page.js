'use client'

import AiImportReview from "@/components/AiImportReview"
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
    mergeUniqueSubscriptions,
    normalizeSubscription,
    parseCsvSubscriptions,
    pickSubscriptionFields,
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
    const [importMode, setImportMode] = useState("standard")
    const [importStrategy, setImportStrategy] = useState("append")
    const [isAiImporting, setIsAiImporting] = useState(false)
    const [aiImportPreview, setAiImportPreview] = useState(null)
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

    function getImportSuccessMessage(importedCount, totalCountAfterImport) {
        // The wording changes so the toast reflects the user's chosen import behavior.
        if (importStrategy === "replace") {
            return `Replaced your subscriptions with ${importedCount} imported rows.`
        }

        if (importStrategy === "unique") {
            return `Imported ${importedCount} new rows. You now have ${totalCountAfterImport} subscriptions.`
        }

        return `Appended ${importedCount} rows. You now have ${totalCountAfterImport} subscriptions.`
    }

    async function handleImportFile(e) {
        const file = e.target.files?.[0]

        if (!file) {
            return
        }

        const text = await file.text()
        if (importMode === "ai") {
            try {
                setIsAiImporting(true)
                // Smart import sends the messy CSV to our backend cleaner first,
                // then shows a review screen before anything is saved.
                const response = await fetch("/api/import/smart", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ csvText: text }),
                })

                const rawResponse = await response.text()
                let payload = null

                try {
                    payload = rawResponse ? JSON.parse(rawResponse) : null
                } catch {
                    payload = { error: rawResponse || "Smart import failed." }
                }

                if (!response.ok) {
                    setToastMessage(payload.error || "Smart import failed.")
                    return
                }

                setAiImportPreview(payload)
                setToastMessage("Smart import review is ready.")
                return
            } catch (error) {
                setToastMessage(error.message || "Smart import failed.")
                return
            } finally {
                setIsAiImporting(false)
                e.target.value = ""
            }
        }

        const importedSubscriptions = parseCsvSubscriptions(text)

        if (!importedSubscriptions.length) {
            setToastMessage("No valid subscriptions were found in that CSV file.")
            return
        }

        // Standard CSV import can still follow the same append/replace/unique rules as smart import.
        const nextSubscriptions =
            importStrategy === "replace"
                ? importedSubscriptions
                : importStrategy === "unique"
                  ? mergeUniqueSubscriptions(subscriptions, importedSubscriptions)
                  : [...subscriptions, ...importedSubscriptions]

        await handleReplaceSubscriptions(nextSubscriptions)
        const importedCount =
            importStrategy === "unique"
                ? nextSubscriptions.length - subscriptions.length
                : importedSubscriptions.length

        setToastMessage(getImportSuccessMessage(importedCount, nextSubscriptions.length))
        // Allow importing the same file again without forcing the user to rename it first.
        e.target.value = ""
    }

    async function handleImportReviewedSubscriptions(reviewedSubscriptions) {
        // Review rows include UI-only fields like confidence/errors/ignored,
        // so trim them back down to pure subscription fields before saving.
        const cleanedSubscriptions = reviewedSubscriptions.map((subscription) => pickSubscriptionFields(subscription))
        const nextSubscriptions =
            importStrategy === "replace"
                ? cleanedSubscriptions
                : importStrategy === "unique"
                  ? mergeUniqueSubscriptions(subscriptions, cleanedSubscriptions)
                  : [...subscriptions, ...cleanedSubscriptions]

        await handleReplaceSubscriptions(nextSubscriptions)
        setAiImportPreview(null)
        const importedCount =
            importStrategy === "unique"
                ? nextSubscriptions.length - subscriptions.length
                : cleanedSubscriptions.length

        setToastMessage(getImportSuccessMessage(importedCount, nextSubscriptions.length))
    }

    function handleIgnorePreviewRow(subscriptionId) {
        setAiImportPreview((previous) => {
            if (!previous) {
                return previous
            }

            // Ignoring does not delete the preview row forever;
            // it only hides it from the current import session.
            const nextSubscriptions = previous.subscriptions.map((subscription) =>
                subscription.id === subscriptionId ? { ...subscription, ignored: true } : subscription
            )

            return {
                ...previous,
                subscriptions: nextSubscriptions,
                validCount: nextSubscriptions.filter((subscription) => subscription.isValid && !subscription.ignored).length,
                invalidCount: nextSubscriptions.filter((subscription) => !subscription.isValid && !subscription.ignored).length,
            }
        })
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
                onImportClick={() => {
                    setImportMode("standard")
                    fileInputRef.current?.click()
                }}
                onAiImportClick={() => {
                    setImportMode("ai")
                    fileInputRef.current?.click()
                }}
                onAdd={() => {
                    setFormData(emptySubscription)
                    setIsAddEntry(true)
                }}
                isAiImporting={isAiImporting}
                importStrategy={importStrategy}
                onImportStrategyChange={setImportStrategy}
            />

            {aiImportPreview && (
                <AiImportReview
                    preview={aiImportPreview}
                    onCancel={() => setAiImportPreview(null)}
                    onImport={handleImportReviewedSubscriptions}
                    onIgnoreRow={handleIgnorePreviewRow}
                    importStrategyLabel={
                        importStrategy === "replace"
                            ? "Replace with"
                            : importStrategy === "unique"
                              ? "Import"
                              : "Import"
                    }
                />
            )}

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
