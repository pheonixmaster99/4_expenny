'use client'

import {
    BILLING_FREQUENCY_OPTIONS,
    CATEGORY_OPTIONS,
    CURRENCY_OPTIONS,
    PAYMENT_METHOD_OPTIONS,
    RENEWAL_OPTIONS,
    STATUS_OPTIONS,
} from "@/utils"

export default function SubscriptionForm(props) {
    const { closeInput, formData, handleChangeInput, handleResetForm, onSubmit, isEditing } = props

    function handleFormSubmit(e) {
        e.preventDefault()
        // The parent decides how to save so this form can stay focused on collecting input only.
        onSubmit()
    }

    return (
        <section className="form-shell card">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Subscription Details</p>
                    <h2>{isEditing ? "Update subscription" : "Add a new subscription"}</h2>
                </div>
                <button type="button" onClick={closeInput}>
                    Close
                </button>
            </div>

            <form onSubmit={handleFormSubmit}>
                {/* Every field reads and writes from the shared formData object.
                    That keeps the form predictable and makes edit mode easy to support. */}
                <label>
                    <span>Subscription name</span>
                    <input
                        value={formData.name}
                        onChange={handleChangeInput}
                        type="text"
                        name="name"
                        placeholder="e.g. Netflix, Spotify, AWS Hosting"
                        required
                    />
                </label>

                <label>
                    <span>Category</span>
                    <select value={formData.category} onChange={handleChangeInput} name="category">
                        {CATEGORY_OPTIONS.map((category) => (
                            <option key={category}>{category}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Cost</span>
                    <input
                        value={formData.cost}
                        onChange={handleChangeInput}
                        type="number"
                        min="0"
                        step="0.01"
                        name="cost"
                        placeholder="e.g. 12.00"
                        required
                    />
                </label>

                <label>
                    <span>Currency</span>
                    <select value={formData.currency} onChange={handleChangeInput} name="currency">
                        {CURRENCY_OPTIONS.map((currency) => (
                            <option key={currency}>{currency}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Billing frequency</span>
                    <select value={formData.billingFrequency} onChange={handleChangeInput} name="billingFrequency">
                        {BILLING_FREQUENCY_OPTIONS.map((frequency) => (
                            <option key={frequency}>{frequency}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Payment method</span>
                    <select value={formData.paymentMethod} onChange={handleChangeInput} name="paymentMethod">
                        {PAYMENT_METHOD_OPTIONS.map((method) => (
                            <option key={method}>{method}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Subscription start date</span>
                    <input value={formData.startDate} onChange={handleChangeInput} type="date" name="startDate" required />
                </label>

                <label>
                    <span>Status</span>
                    <select value={formData.status} onChange={handleChangeInput} name="status">
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status}>{status}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Renewal type</span>
                    <select value={formData.renewalType} onChange={handleChangeInput} name="renewalType">
                        {RENEWAL_OPTIONS.map((option) => (
                            <option key={option}>{option}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Reminder lead time (days)</span>
                    <input
                        value={formData.alertBeforeDays}
                        onChange={handleChangeInput}
                        type="number"
                        min="0"
                        max="30"
                        name="alertBeforeDays"
                    />
                </label>

                <label>
                    <span>Trial end date</span>
                    <input value={formData.trialEndDate} onChange={handleChangeInput} type="date" name="trialEndDate" />
                </label>

                <label className="fat-column">
                    <span>Notes</span>
                    <textarea
                        value={formData.notes}
                        onChange={handleChangeInput}
                        name="notes"
                        placeholder="e.g. Shared with family, includes cloud storage"
                        rows="4"
                    />
                </label>

                <div className="fat-column form-submit-btns">
                    <button type="button" onClick={closeInput}>
                        Cancel
                    </button>
                    <button type="button" onClick={handleResetForm}>
                        Reset
                    </button>
                    <button type="submit">{isEditing ? "Save changes" : "Add subscription"}</button>
                </div>
            </form>
        </section>
    )
}
