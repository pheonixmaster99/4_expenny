import {
    BILLING_FREQUENCY_OPTIONS,
    CATEGORY_OPTIONS,
    CURRENCY_OPTIONS,
    PAYMENT_METHOD_OPTIONS,
    RENEWAL_OPTIONS,
    STATUS_OPTIONS,
    normalizeSubscription,
    parseCsvRows,
    validateSubscriptionRecord,
} from "@/utils"

const headerAliases = {
    name: ["name", "service", "subscription", "merchant", "vendor", "platform"],
    category: ["category", "type", "group"],
    cost: ["cost", "amount", "price", "charge", "monthly_cost"],
    currency: ["currency", "curr", "money"],
    billingFrequency: ["billingfrequency", "billing_frequency", "billed_every", "frequency", "interval", "recurring"],
    paymentMethod: ["paymentmethod", "payment_method", "pay_source", "payment", "card", "paid_with"],
    startDate: ["startdate", "start_date", "started_on", "started", "renewal_date", "date"],
    renewalType: ["renewaltype", "renewal_type", "renewal", "renewal_mode"],
    trialEndDate: ["trialenddate", "trial_end_date", "trial_ends", "trial_end"],
    status: ["status", "current_state", "state"],
    alertBeforeDays: ["alertbeforedays", "alert_before_days", "reminder_days", "remind_before"],
    notes: ["notes", "extra_notes", "description", "memo", "comment"],
}

function normalizeHeader(header = "") {
    // Normalize headers so "started_on", "Started On", and "started-on"
    // all become comparable keys.
    return header.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function findFieldIndex(headers, field) {
    const normalizedHeaders = headers.map(normalizeHeader)
    const aliases = (headerAliases[field] || []).map(normalizeHeader)
    return normalizedHeaders.findIndex((header) => aliases.includes(header))
}

function normalizeBillingFrequency(value = "") {
    const normalized = value.toLowerCase().trim()

    if (normalized.includes("year") || normalized.includes("annual")) return "Yearly"
    if (normalized.includes("quarter")) return "Quarterly"
    if (normalized.includes("one time") || normalized.includes("onetime") || normalized.includes("once")) return "One-time"
    if (normalized.includes("month")) return "Monthly"

    return "Monthly"
}

function normalizePaymentMethod(value = "") {
    const normalized = value.toLowerCase().trim()

    if (normalized.includes("paypal")) return "Paypal"
    if (normalized.includes("bank")) return "Bank Transfer"
    if (normalized.includes("debit")) return "Debit Card"
    if (normalized.includes("cash")) return "Cash"
    if (normalized.includes("visa") || normalized.includes("mastercard") || normalized.includes("credit")) return "Credit Card"

    return "Credit Card"
}

function normalizeStatus(value = "") {
    const normalized = value.toLowerCase().trim()

    if (normalized.includes("pause")) return "Paused"
    if (normalized.includes("cancel")) return "Cancelled"
    if (normalized.includes("trial")) return "Active"

    return "Active"
}

function normalizeRenewalType(value = "") {
    const normalized = value.toLowerCase().trim()

    if (normalized.includes("manual")) return "Manual"
    if (normalized.includes("trial")) return "Trial"

    return "Automatic"
}

function normalizeCurrency(value = "") {
    const upper = value.trim().toUpperCase()
    return CURRENCY_OPTIONS.includes(upper) ? upper : "USD"
}

function guessCategory(name = "", notes = "") {
    const text = `${name} ${notes}`.toLowerCase()

    if (text.includes("spotify") || text.includes("music")) return "Music"
    if (text.includes("netflix") || text.includes("disney") || text.includes("stream")) return "Entertainment"
    if (text.includes("dropbox") || text.includes("hosting") || text.includes("domain") || text.includes("cloud")) return "Web Services"
    if (text.includes("adobe") || text.includes("figma") || text.includes("canva")) return "Software"
    if (text.includes("gym") || text.includes("fitness") || text.includes("headspace")) return "Health & Fitness"
    if (text.includes("notion") || text.includes("chatgpt") || text.includes("workspace")) return "Productivity"
    if (text.includes("prime") || text.includes("shopping")) return "Shopping"
    if (text.includes("duolingo") || text.includes("course") || text.includes("education")) return "Education"

    return "Other"
}

function normalizeDate(value = "") {
    if (!value.trim()) return ""

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""

    return date.toISOString().slice(0, 10)
}

function normalizeCost(value = "") {
    const cleaned = String(value).replace(/[^0-9.-]/g, "")
    return cleaned || "0"
}

function rowLooksLikeSubscription(record) {
    // This is a lightweight heuristic, not a guarantee.
    // It tries to catch obvious recurring services while filtering common one-off purchases.
    const name = record.name.toLowerCase()
    const notes = record.notes.toLowerCase()
    const billing = record.billingFrequency.toLowerCase()
    const subscriptionHints = ["netflix", "spotify", "prime", "adobe", "figma", "dropbox", "membership", "plan", "subscription"]
    const negativeHints = ["not a subscription", "single purchase", "one time", "one-time", "coffee shop", "grocery", "restaurant"]

    if (negativeHints.some((hint) => name.includes(hint) || notes.includes(hint))) {
        return false
    }

    if (billing === "one-time") {
        return false
    }

    if (subscriptionHints.some((hint) => name.includes(hint) || notes.includes(hint))) {
        return true
    }

    return true
}

export async function POST(request) {
    try {
        const { csvText } = await request.json()

        if (!csvText?.trim()) {
            return Response.json({ error: "No CSV content was provided." }, { status: 400 })
        }

        const rows = parseCsvRows(csvText)
        if (rows.length < 2) {
            return Response.json({ error: "The CSV needs a header row and at least one data row." }, { status: 400 })
        }

        const [headers, ...dataRows] = rows
        const warnings = []
        // Store the matched column positions once so each data row can reuse them.
        const fieldIndexes = {
            name: findFieldIndex(headers, "name"),
            category: findFieldIndex(headers, "category"),
            cost: findFieldIndex(headers, "cost"),
            currency: findFieldIndex(headers, "currency"),
            billingFrequency: findFieldIndex(headers, "billingFrequency"),
            paymentMethod: findFieldIndex(headers, "paymentMethod"),
            startDate: findFieldIndex(headers, "startDate"),
            renewalType: findFieldIndex(headers, "renewalType"),
            trialEndDate: findFieldIndex(headers, "trialEndDate"),
            status: findFieldIndex(headers, "status"),
            alertBeforeDays: findFieldIndex(headers, "alertBeforeDays"),
            notes: findFieldIndex(headers, "notes"),
        }

        const subscriptions = dataRows.map((row, index) => {
            const rawName = row[fieldIndexes.name] || row[0] || ""
            const rawNotes = row[fieldIndexes.notes] || ""
            // Each row gets normalized into the app's subscription schema,
            // even if the original CSV used different column names.
            const normalized = normalizeSubscription({
                name: rawName,
                category: row[fieldIndexes.category] || guessCategory(rawName, rawNotes),
                cost: normalizeCost(row[fieldIndexes.cost]),
                currency: normalizeCurrency(row[fieldIndexes.currency] || "USD"),
                billingFrequency: normalizeBillingFrequency(row[fieldIndexes.billingFrequency] || ""),
                paymentMethod: normalizePaymentMethod(row[fieldIndexes.paymentMethod] || ""),
                startDate: normalizeDate(row[fieldIndexes.startDate] || ""),
                renewalType: normalizeRenewalType(row[fieldIndexes.renewalType] || row[fieldIndexes.status] || ""),
                trialEndDate: normalizeDate(row[fieldIndexes.trialEndDate] || ""),
                status: normalizeStatus(row[fieldIndexes.status] || ""),
                alertBeforeDays: row[fieldIndexes.alertBeforeDays] || "3",
                notes: rawNotes,
            })
            const validation = validateSubscriptionRecord(normalized)
            const looksLikeSubscription = rowLooksLikeSubscription(normalized)

            return {
                ...normalized,
                confidence: looksLikeSubscription && validation.isValid ? 0.9 : validation.isValid ? 0.65 : 0.35,
                sourceRow: `Row ${index + 2}`,
                errors: looksLikeSubscription ? validation.errors : [...validation.errors, "This row may not be a subscription"],
                isValid: looksLikeSubscription && validation.isValid,
                ignored: false,
            }
        })

        if (fieldIndexes.name === -1) {
            warnings.push("No obvious name column was found, so the first column was used as the subscription name.")
        }

        if (fieldIndexes.category === -1) {
            warnings.push("Categories were guessed from the subscription name and notes.")
        }

        if (fieldIndexes.billingFrequency === -1) {
            warnings.push("Billing frequency was inferred from the row text and defaults to Monthly when unclear.")
        }

        return Response.json({
            summary: "Smart import cleaned the CSV using local rules and common header/value mappings.",
            warnings,
            subscriptions,
            validCount: subscriptions.filter((subscription) => subscription.isValid).length,
            invalidCount: subscriptions.filter((subscription) => !subscription.isValid).length,
        })
    } catch (error) {
        return Response.json({ error: error.message || "Smart import failed." }, { status: 500 })
    }
}
