import { formatCurrency, formatDate, getDaysUntilNextCharge, getNextBillingDate } from "@/utils"

export default function SubscriptionsDisplay(props) {
    const { subscriptions, onAdd, onDelete, onEdit } = props

    return (
        <section>
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Library</p>
                    <h2>Your subscriptions</h2>
                </div>
                <button onClick={onAdd}>Add subscription</button>
            </div>

            {!subscriptions.length ? (
                <div className="card empty-state">
                    <h3>No subscriptions match these filters</h3>
                    <p>Try clearing your filters or add a new subscription to start building your dashboard.</p>
                    <button onClick={onAdd}>Add your first subscription</button>
                </div>
            ) : (
                <div className="card-container">
                    {subscriptions.map((subscription) => {
                        // These values are calculated per card so each item can explain its own renewal timing.
                        const nextBillingDate = getNextBillingDate(subscription.startDate, subscription.billingFrequency)
                        const daysUntilCharge = getDaysUntilNextCharge(subscription.startDate, subscription.billingFrequency)

                        return (
                            <article key={subscription.id} className="card subscription-card">
                                <div className="subscription-card-top">
                                    <div>
                                        <h3>{subscription.name}</h3>
                                        <p>{subscription.category}</p>
                                    </div>
                                    <div
                                        className={`status ${
                                            subscription.status === "Active" ? "card-button-primary" : "card-button-secondary"
                                        }`}
                                    >
                                        <small>{subscription.status}</small>
                                    </div>
                                </div>

                                <div className="sub-cost">
                                    <h2>{formatCurrency(subscription.cost, subscription.currency)}</h2>
                                    <p>{subscription.billingFrequency}</p>
                                </div>

                                <div className="subscription-meta-grid">
                                    <div>
                                        <p>Started</p>
                                        <h4>{formatDate(subscription.startDate)}</h4>
                                    </div>
                                    <div>
                                        <p>Next bill</p>
                                        <h4>{nextBillingDate ? formatDate(nextBillingDate) : "No renewal"}</h4>
                                    </div>
                                    <div>
                                        <p>Charge in</p>
                                        <h4>{typeof daysUntilCharge === "number" ? `${daysUntilCharge} days` : daysUntilCharge}</h4>
                                    </div>
                                    <div>
                                        <p>Renewal</p>
                                        <h4>{subscription.renewalType}</h4>
                                    </div>
                                </div>

                                <div className="white-line" />

                                <div className="card-detail-stack">
                                    <p>
                                        <strong>Payment:</strong> {subscription.paymentMethod}
                                    </p>
                                    {subscription.trialEndDate && (
                                        <p>
                                            <strong>Trial ends:</strong> {formatDate(subscription.trialEndDate)}
                                        </p>
                                    )}
                                    <p className="notes-preview">{subscription.notes || "No notes added yet."}</p>
                                </div>

                                <div className="subscription-actions">
                                    <button onClick={() => onEdit(subscription)}>Edit</button>
                                    <button onClick={() => onDelete(subscription.id)}>Delete</button>
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
