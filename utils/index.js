const DAY_IN_MS = 1000 * 60 * 60 * 24

export const CATEGORY_OPTIONS = [
    "Entertainment",
    "Music",
    "Software",
    "Web Services",
    "Health & Fitness",
    "Productivity",
    "Shopping",
    "Education",
    "Other",
]

export const CURRENCY_OPTIONS = ["USD", "CAD", "EUR", "GBP", "AUD", "NZD", "Other"]
export const BILLING_FREQUENCY_OPTIONS = ["Monthly", "Yearly", "Quarterly", "One-time"]
export const PAYMENT_METHOD_OPTIONS = ["Credit Card", "Debit Card", "Paypal", "Bank Transfer", "Cash", "Other"]
export const STATUS_OPTIONS = ["Active", "Paused", "Cancelled"]
export const RENEWAL_OPTIONS = ["Automatic", "Manual", "Trial"]
export const SORT_OPTIONS = [
    { value: "nextCharge", label: "Next charge" },
    { value: "highestCost", label: "Highest cost" },
    { value: "lowestCost", label: "Lowest cost" },
    { value: "name", label: "Name" },
    { value: "recentlyAdded", label: "Recently added" },
]

export const emptySubscription = {
    id: "",
    name: "",
    category: "Web Services",
    cost: "",
    currency: "USD",
    billingFrequency: "Monthly",
    paymentMethod: "Credit Card",
    startDate: "",
    renewalType: "Automatic",
    trialEndDate: "",
    notes: "",
    status: "Active",
    alertBeforeDays: "3",
    createdAt: "",
    updatedAt: "",
}

export const SUBSCRIPTION_FIELDS = [
    "name",
    "category",
    "cost",
    "currency",
    "billingFrequency",
    "paymentMethod",
    "startDate",
    "renewalType",
    "trialEndDate",
    "status",
    "alertBeforeDays",
    "notes",
]

export function createSubscriptionId() {
    // Firestore can store arrays of plain objects, so we generate ids ourselves for stable edit/delete behavior.
    return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function normalizeSubscription(subscription = {}) {
    const timestamp = new Date().toISOString()

    // Normalization gives every record the same shape so the UI does not have to guard every field manually.
    return {
        ...emptySubscription,
        ...subscription,
        id: subscription.id || createSubscriptionId(),
        name: subscription.name?.trim() || "",
        category: subscription.category || emptySubscription.category,
        cost: subscription.cost === 0 ? "0" : String(subscription.cost || ""),
        currency: subscription.currency || emptySubscription.currency,
        billingFrequency: subscription.billingFrequency || emptySubscription.billingFrequency,
        paymentMethod: subscription.paymentMethod || emptySubscription.paymentMethod,
        startDate: subscription.startDate || "",
        renewalType: subscription.renewalType || emptySubscription.renewalType,
        trialEndDate: subscription.trialEndDate || "",
        notes: subscription.notes?.trim() || "",
        status: subscription.status || emptySubscription.status,
        alertBeforeDays: String(subscription.alertBeforeDays || emptySubscription.alertBeforeDays),
        createdAt: subscription.createdAt || timestamp,
        updatedAt: timestamp,
    }
}

export function normalizeSubscriptions(subscriptions = []) {
    return subscriptions.map(normalizeSubscription)
}

export function pickSubscriptionFields(subscription = {}) {
    // Keep only the fields that belong in saved/exported subscription data.
    // This drops review-only values like confidence, errors, and ignored.
    return SUBSCRIPTION_FIELDS.reduce((accumulator, field) => {
        accumulator[field] = subscription[field] ?? emptySubscription[field] ?? ""
        return accumulator
    }, {})
}

export function isValidDateString(value) {
    if (!value) {
        return false
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function validateSubscriptionRecord(subscription = {}) {
    const errors = []
    const cost = Number(subscription.cost)

    if (!subscription.name?.trim()) {
        errors.push("Missing subscription name")
    }

    if (!CATEGORY_OPTIONS.includes(subscription.category)) {
        errors.push("Unknown category")
    }

    if (!Number.isFinite(cost) || cost < 0) {
        errors.push("Invalid cost")
    }

    if (!CURRENCY_OPTIONS.includes(subscription.currency)) {
        errors.push("Unknown currency")
    }

    if (!BILLING_FREQUENCY_OPTIONS.includes(subscription.billingFrequency)) {
        errors.push("Unknown billing frequency")
    }

    if (!PAYMENT_METHOD_OPTIONS.includes(subscription.paymentMethod)) {
        errors.push("Unknown payment method")
    }

    if (!STATUS_OPTIONS.includes(subscription.status)) {
        errors.push("Unknown status")
    }

    if (!RENEWAL_OPTIONS.includes(subscription.renewalType)) {
        errors.push("Unknown renewal type")
    }

    if (!isValidDateString(subscription.startDate)) {
        errors.push("Missing or invalid start date")
    }

    if (subscription.trialEndDate && !isValidDateString(subscription.trialEndDate)) {
        errors.push("Invalid trial end date")
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

export function formatCurrency(value, currency = "USD") {
    const amount = Number(value) || 0

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency === "Other" ? "USD" : currency,
            maximumFractionDigits: 2,
        }).format(amount)
    } catch {
        return `$${amount.toFixed(2)}`
    }
}

export function formatDate(dateInput) {
    if (!dateInput) {
        return "Not set"
    }

    const date =
        dateInput instanceof Date
            ? dateInput
            : String(dateInput).includes("T")
              ? new Date(dateInput)
              : new Date(`${dateInput}T00:00:00`)

    if (Number.isNaN(date.getTime())) {
        return "Not set"
    }

    return new Intl.DateTimeFormat("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date)
}

export function getBillingCycleMonths(billingFrequency) {
    switch (billingFrequency) {
        case "Yearly":
            return 12
        case "Quarterly":
            return 3
        case "One-time":
            return null
        case "Monthly":
        default:
            return 1
    }
}

export function getMonthlyCost(subscription) {
    const amount = Number(subscription.cost) || 0

    // Convert everything into a monthly equivalent so mixed billing plans can be compared fairly.
    switch (subscription.billingFrequency) {
        case "Yearly":
            return amount / 12
        case "Quarterly":
            return amount / 3
        case "One-time":
            return 0
        case "Monthly":
        default:
            return amount
    }
}

export function getYearlyCost(subscription) {
    const amount = Number(subscription.cost) || 0

    switch (subscription.billingFrequency) {
        case "Yearly":
            return amount
        case "Quarterly":
            return amount * 4
        case "One-time":
            return amount
        case "Monthly":
        default:
            return amount * 12
    }
}

export function getNextBillingDate(startDate, billingFrequency) {
    if (!startDate) {
        return null
    }

    if (billingFrequency === "One-time") {
        return null
    }

    const cycleMonths = getBillingCycleMonths(billingFrequency)
    const today = new Date()
    const start = new Date(`${startDate}T00:00:00`)

    if (Number.isNaN(start.getTime()) || cycleMonths === null) {
        return null
    }

    const nextBillingDate = new Date(start)

    // Walk forward one billing cycle at a time until we land on the next future charge.
    while (nextBillingDate <= today) {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + cycleMonths)
    }

    return nextBillingDate
}

export function getDaysUntilNextCharge(startDate, billingFrequency) {
    const nextBillingDate = getNextBillingDate(startDate, billingFrequency)

    if (!nextBillingDate) {
        return "No upcoming charge"
    }

    return Math.ceil((nextBillingDate.getTime() - Date.now()) / DAY_IN_MS)
}

export function getTrialDaysRemaining(trialEndDate) {
    if (!trialEndDate) {
        return null
    }

    const trialDate = new Date(`${trialEndDate}T00:00:00`)

    if (Number.isNaN(trialDate.getTime())) {
        return null
    }

    return Math.ceil((trialDate.getTime() - Date.now()) / DAY_IN_MS)
}

export function getUpcomingBills(subscriptions = [], windowInDays = 30) {
    return subscriptions
        .filter((subscription) => subscription.status === "Active")
        .map((subscription) => {
            const nextBillingDate = getNextBillingDate(subscription.startDate, subscription.billingFrequency)
            const daysUntilCharge = nextBillingDate ? Math.ceil((nextBillingDate.getTime() - Date.now()) / DAY_IN_MS) : null

            return {
                ...subscription,
                nextBillingDate,
                daysUntilCharge,
                monthlyCost: getMonthlyCost(subscription),
            }
        })
        .filter((subscription) => subscription.daysUntilCharge !== null && subscription.daysUntilCharge <= windowInDays)
        .sort((a, b) => a.daysUntilCharge - b.daysUntilCharge)
}

export function getCategoryBreakdown(subscriptions = []) {
    const bucket = {}

    subscriptions
        .filter((subscription) => subscription.status === "Active")
        .forEach((subscription) => {
            const category = subscription.category || "Other"
            bucket[category] = (bucket[category] || 0) + getMonthlyCost(subscription)
        })

    return Object.entries(bucket)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)
}

export function getSavingsOpportunities(subscriptions = []) {
    return subscriptions
        .filter((subscription) => subscription.status !== "Active" || subscription.renewalType === "Manual")
        .map((subscription) => ({
            ...subscription,
            monthlySavings: getMonthlyCost(subscription),
        }))
        .sort((a, b) => b.monthlySavings - a.monthlySavings)
}

export function calculateSubscriptionMetrics(subscriptions = []) {
    // This is the main analytics aggregator for the dashboard cards and summary widgets.
    const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "Active")
    const upcomingBills = getUpcomingBills(subscriptions, 7)
    const savingsOpportunities = getSavingsOpportunities(subscriptions)
    const categoryBreakdown = getCategoryBreakdown(subscriptions)
    const totalMonthlyCost = activeSubscriptions.reduce((total, subscription) => total + getMonthlyCost(subscription), 0)
    const totalYearlyCost = activeSubscriptions.reduce((total, subscription) => total + getYearlyCost(subscription), 0)
    const averageMonthlySpending = activeSubscriptions.length ? totalMonthlyCost / activeSubscriptions.length : 0
    const mostExpensiveSubscription = [...activeSubscriptions].sort((a, b) => Number(b.cost) - Number(a.cost))[0]
    const trialEndingSoonCount = subscriptions.filter((subscription) => {
        const daysRemaining = getTrialDaysRemaining(subscription.trialEndDate)
        return daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7
    }).length

    return {
        totalMonthlyCost,
        totalYearlyCost,
        averageMonthlySpending,
        activeSubscriptions: activeSubscriptions.length,
        pausedSubscriptions: subscriptions.filter((subscription) => subscription.status === "Paused").length,
        cancelledSubscriptions: subscriptions.filter((subscription) => subscription.status === "Cancelled").length,
        upcomingBillingCount: upcomingBills.length,
        trialEndingSoonCount,
        topSpendingCategory: categoryBreakdown[0]?.category || "None",
        potentialMonthlySavings: savingsOpportunities.reduce((total, subscription) => total + subscription.monthlySavings, 0),
        mostExpensiveSubscription: mostExpensiveSubscription?.name || "None",
    }
}

export function filterSubscriptions(subscriptions = [], filters = {}) {
    const search = filters.search?.trim().toLowerCase() || ""

    return subscriptions.filter((subscription) => {
        const matchesSearch =
            !search ||
            subscription.name.toLowerCase().includes(search) ||
            subscription.notes.toLowerCase().includes(search) ||
            subscription.category.toLowerCase().includes(search)
        const matchesStatus = filters.status === "All" || !filters.status || subscription.status === filters.status
        const matchesCategory = filters.category === "All" || !filters.category || subscription.category === filters.category
        const matchesBilling =
            filters.billingFrequency === "All" ||
            !filters.billingFrequency ||
            subscription.billingFrequency === filters.billingFrequency

        return matchesSearch && matchesStatus && matchesCategory && matchesBilling
    })
}

export function sortSubscriptions(subscriptions = [], sortBy = "nextCharge") {
    const sorted = [...subscriptions]

    switch (sortBy) {
        case "highestCost":
            return sorted.sort((a, b) => Number(b.cost) - Number(a.cost))
        case "lowestCost":
            return sorted.sort((a, b) => Number(a.cost) - Number(b.cost))
        case "name":
            return sorted.sort((a, b) => a.name.localeCompare(b.name))
        case "recentlyAdded":
            return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        case "nextCharge":
        default:
            return sorted.sort((a, b) => {
                const aDate = getNextBillingDate(a.startDate, a.billingFrequency)
                const bDate = getNextBillingDate(b.startDate, b.billingFrequency)

                if (!aDate && !bDate) {
                    return a.name.localeCompare(b.name)
                }

                if (!aDate) {
                    return 1
                }

                if (!bDate) {
                    return -1
                }

                return aDate.getTime() - bDate.getTime()
            })
    }
}

export function parseCsvSubscriptions(csvText = "") {
    const [headerLine, ...rows] = csvText.trim().split(/\r?\n/)

    if (!headerLine) {
        return []
    }

    const headers = headerLine.split(",").map((header) => header.trim())

    return rows
        .filter(Boolean)
        .map((row) => {
            // This regex preserves quoted commas so notes like "TV, movies, and music" stay intact.
            const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []
            const record = headers.reduce((accumulator, header, index) => {
                const cleanedValue = values[index]?.replace(/^"|"$/g, "").replace(/""/g, '"') || ""
                accumulator[header] = cleanedValue
                return accumulator
            }, {})

            return normalizeSubscription(record)
        })
}

export function parseCsvRows(csvText = "") {
    const rows = csvText.trim().split(/\r?\n/).filter(Boolean)

    return rows.map((row) => row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map((value) => value.replace(/^"|"$/g, "").replace(/""/g, '"')) || [])
}

export function convertSubscriptionsToCsv(subscriptions = []) {
    const headers = SUBSCRIPTION_FIELDS

    const escapeValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`

    const lines = subscriptions.map((subscription) =>
        headers.map((header) => escapeValue(subscription[header])).join(",")
    )

    return [headers.join(","), ...lines].join("\n")
}

export function mergeUniqueSubscriptions(existingSubscriptions = [], importedSubscriptions = []) {
    // Build a lightweight identity key so we can skip obvious duplicates during import.
    const existingKeys = new Set(
        existingSubscriptions.map((subscription) =>
            [
                subscription.name?.trim().toLowerCase(),
                subscription.cost,
                subscription.billingFrequency,
                subscription.startDate,
            ].join("|")
        )
    )

    const uniqueImports = importedSubscriptions.filter((subscription) => {
        const key = [
            subscription.name?.trim().toLowerCase(),
            subscription.cost,
            subscription.billingFrequency,
            subscription.startDate,
        ].join("|")

        return !existingKeys.has(key)
    })

    return [...existingSubscriptions, ...uniqueImports]
}
