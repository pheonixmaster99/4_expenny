import { formatCurrency, formatDate } from "@/utils"

export default function AiImportReview(props) {
    const { preview, onCancel, onImport, onIgnoreRow, importStrategyLabel } = props
    // Ignore actions only affect the current review session, so derive the visible rows here.
    const visibleSubscriptions = preview.subscriptions.filter((subscription) => !subscription.ignored)
    const validSubscriptions = visibleSubscriptions.filter((subscription) => subscription.isValid)

    return (
        <section className="card ai-review-shell">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Smart Import Review</p>
                    <h2>Review cleaned subscription rows</h2>
                </div>
                <div className="toolbar-actions">
                    <button onClick={onCancel}>Dismiss</button>
                    <button onClick={() => onImport(validSubscriptions)} disabled={!validSubscriptions.length}>
                        {importStrategyLabel} {validSubscriptions.length} valid rows
                    </button>
                </div>
            </div>

            <p>{preview.summary}</p>

            {!!preview.warnings?.length && (
                <div className="ai-warning-list">
                    {preview.warnings.map((warning, index) => (
                        <p key={index}>{warning}</p>
                    ))}
                </div>
            )}

            <div className="ai-review-meta">
                <p>Valid rows: {validSubscriptions.length}</p>
                <p>Needs review: {visibleSubscriptions.filter((subscription) => !subscription.isValid).length}</p>
                <p>Ignored: {preview.subscriptions.filter((subscription) => subscription.ignored).length}</p>
            </div>

            <div className="ai-review-list">
                {visibleSubscriptions.map((subscription) => (
                    <article key={subscription.id} className="card ai-review-card">
                        <div className="subscription-card-top">
                            <div>
                                <h3>{subscription.name}</h3>
                                <p>
                                    {subscription.category} | {formatCurrency(subscription.cost, subscription.currency)}
                                </p>
                            </div>
                            <div className={`status ${subscription.isValid ? "card-button-primary" : "card-button-secondary"}`}>
                                <small>{subscription.isValid ? "Ready" : "Review"}</small>
                            </div>
                        </div>

                        <div className="subscription-meta-grid">
                            <div>
                                <p>Frequency</p>
                                <h4>{subscription.billingFrequency}</h4>
                            </div>
                            <div>
                                <p>Start date</p>
                                <h4>{formatDate(subscription.startDate)}</h4>
                            </div>
                            <div>
                                <p>Confidence</p>
                                <h4>{Math.round((subscription.confidence || 0) * 100)}%</h4>
                            </div>
                            <div>
                                <p>Source</p>
                                <h4>{subscription.sourceRow || "Unknown row"}</h4>
                            </div>
                        </div>

                        {!!subscription.errors?.length && (
                            <div className="ai-error-list">
                                {subscription.errors.map((error, index) => (
                                    <p key={index}>{error}</p>
                                ))}
                            </div>
                        )}

                        {!!subscription.notes && <p className="notes-preview">{subscription.notes}</p>}

                        <div className="subscription-actions">
                            <button onClick={() => onIgnoreRow(subscription.id)} type="button">
                                Ignore row
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}
