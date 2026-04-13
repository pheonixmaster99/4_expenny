import { formatCurrency, formatDate } from "@/utils"

export default function UpcomingBills(props) {
    const { subscriptions } = props

    return (
        <section className="card">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Timeline</p>
                    <h2>Upcoming bills</h2>
                </div>
                <p className="section-caption">Next 30 days</p>
            </div>

            {!subscriptions.length ? (
                <p>No active bills are due in the next 30 days.</p>
            ) : (
                <div className="upcoming-list">
                    {/* This component expects subscriptions that already include nextBillingDate and daysUntilCharge.
                        That preprocessing happens in the dashboard page via getUpcomingBills(...). */}
                    {subscriptions.map((subscription) => (
                        <div key={subscription.id} className="upcoming-row">
                            <div>
                                <h4>{subscription.name}</h4>
                                <p>{formatDate(subscription.nextBillingDate)} • {subscription.billingFrequency}</p>
                            </div>
                            <div className="upcoming-row-meta">
                                <strong>{formatCurrency(subscription.cost, subscription.currency)}</strong>
                                <small>{subscription.daysUntilCharge} days away</small>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
