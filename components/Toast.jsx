export default function Toast(props) {
    const { message } = props

    if (!message) {
        return null
    }

    return (
        <div className="toast card" role="status" aria-live="polite">
            <p>{message}</p>
        </div>
    )
}
