import { calculateSubscriptionMetrics, formatCurrency, getCategoryBreakdown } from "@/utils"

const metricConfig = [
    { key: "totalMonthlyCost", label: "Monthly spend" },
    { key: "totalYearlyCost", label: "Yearly spend" },
    { key: "activeSubscriptions", label: "Active subscriptions" },
    { key: "upcomingBillingCount", label: "Bills due in 7 days" },
    { key: "trialEndingSoonCount", label: "Trials ending soon" },
    { key: "potentialMonthlySavings", label: "Potential monthly savings" },
]

export default function SubscriptionSummary(props) {
    const { subscriptions } = props
    // Build high-level numbers once here, then feed them into the different dashboard sections below.
    const summary = calculateSubscriptionMetrics(subscriptions)
    const categoryBreakdown = getCategoryBreakdown(subscriptions)
    const topCategoryTotal = categoryBreakdown[0]?.total || 0

    return (
        <section>
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Overview</p>
                    <h2>Subscription analytics</h2>
                </div>
                <p className="section-caption">See where your money goes and what needs attention next.</p>
            </div>

            <div className="analytics-card">
                {metricConfig.map((metric) => {
                    const value = summary[metric.key]
                    const displayValue = metric.key.toLowerCase().includes("cost") || metric.key.includes("Savings")
                        ? formatCurrency(value)
                        : value

                    return (
                        <div key={metric.key} className="analytics-item">
                            <p>{metric.label}</p>
                            <h4>{displayValue}</h4>
                        </div>
                    )
                })}
            </div>

            <div className="insight-grid">
                <div className="card insight-card">
                    <p className="eyebrow">Top category</p>
                    <h3>{summary.topSpendingCategory}</h3>
                    <p>
                        {summary.topSpendingCategory === "None"
                            ? "Add active subscriptions to see category insights."
                            : `${formatCurrency(topCategoryTotal)} per month is currently concentrated here.`}
                    </p>
                </div>

                <div className="card insight-card">
                    <p className="eyebrow">Biggest subscription</p>
                    <h3>{summary.mostExpensiveSubscription}</h3>
                    <p>Use this as a quick starting point for savings reviews or cancellation checks.</p>
                </div>
            </div>

            <div className="card category-breakdown">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Breakdown</p>
                        <h3>Monthly spend by category</h3>
                    </div>
                </div>

                {!categoryBreakdown.length ? (
                    <p>No active subscriptions yet.</p>
                ) : (
                    <div className="breakdown-list">
                        {categoryBreakdown.map((item) => {
                            // Scale each bar relative to the largest category so the visual comparison feels natural.
                            const percent = topCategoryTotal ? (item.total / topCategoryTotal) * 100 : 0

                            return (
                                <div key={item.category} className="breakdown-row">
                                    <div className="breakdown-copy">
                                        <p>{item.category}</p>
                                        <strong>{formatCurrency(item.total)}</strong>
                                    </div>
                                    <div className="breakdown-bar-track">
                                        <div className="breakdown-bar-fill" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </section>
    )
}
