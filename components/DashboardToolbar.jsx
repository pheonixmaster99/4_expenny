import {
    BILLING_FREQUENCY_OPTIONS,
    CATEGORY_OPTIONS,
    SORT_OPTIONS,
    STATUS_OPTIONS,
} from "@/utils"

export default function DashboardToolbar(props) {
    const { filters, onFilterChange, onClearFilters, onExport, onImportClick, onAiImportClick, onAdd, isAiImporting, importStrategy, onImportStrategyChange } = props

    return (
        <section className="card toolbar-shell">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Workspace</p>
                    <h2>Manage your subscriptions</h2>
                </div>
                <div className="toolbar-actions">
                    <button onClick={onImportClick}>Import CSV</button>
                    <button onClick={onAiImportClick} disabled={isAiImporting}>
                        {isAiImporting ? "Cleaning..." : "Smart Clean CSV"}
                    </button>
                    <button onClick={onExport}>Export CSV</button>
                    <button onClick={onAdd}>Add subscription</button>
                </div>
            </div>

            <div className="toolbar-grid">
                {/* All of these controls are "controlled inputs":
                    their values come from dashboard state, and changes flow back up through onFilterChange. */}
                <label>
                    <span>Search</span>
                    <input
                        name="search"
                        value={filters.search}
                        onChange={onFilterChange}
                        placeholder="Search by name, notes, or category"
                    />
                </label>

                <label>
                    <span>Status</span>
                    <select name="status" value={filters.status} onChange={onFilterChange}>
                        <option>All</option>
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status}>{status}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Category</span>
                    <select name="category" value={filters.category} onChange={onFilterChange}>
                        <option>All</option>
                        {CATEGORY_OPTIONS.map((category) => (
                            <option key={category}>{category}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Billing frequency</span>
                    <select name="billingFrequency" value={filters.billingFrequency} onChange={onFilterChange}>
                        <option>All</option>
                        {BILLING_FREQUENCY_OPTIONS.map((frequency) => (
                            <option key={frequency}>{frequency}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Sort by</span>
                    <select name="sortBy" value={filters.sortBy} onChange={onFilterChange}>
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Import behavior</span>
                    <select value={importStrategy} onChange={(e) => onImportStrategyChange(e.target.value)}>
                        <option value="append">Append to existing</option>
                        <option value="replace">Replace all</option>
                        <option value="unique">Import only new rows</option>
                    </select>
                </label>

                <div className="toolbar-clear">
                    <p>Need a fresh view?</p>
                    <button onClick={onClearFilters}>Clear filters</button>
                </div>
            </div>
        </section>
    )
}
