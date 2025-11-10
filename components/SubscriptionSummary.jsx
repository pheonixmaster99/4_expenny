import { useAuth } from "@/context/AuthContext"
import { calculateSubscriptionMetrics, subscriptions } from "@/utils"

export default function SubscriptionSummary() {
    const { userData } = useAuth()
    const summary = calculateSubscriptionMetrics(userData.subscriptions)
    console.log(summary)

    const emojis = ['🔥', '✅', '⭐️', '⚡️', '🎉', '✨', '🏆', '🌼', '🌱', '🐛', '🐙', '🪼']

    return (
        <section>
            <h2>Subscription Analytics</h2>
            <div className="analytics-card">
                {Object.keys(summary).map((metric, metricIndex) => {
                    return (

                        <div key={metricIndex} className="analytics-item">
                            <p>{emojis[metricIndex]} {metric.replaceAll('_', ' ')}</p> {/* emojis[metrixIndex] Sequentially select each of the emojis from the emojis list. metric.replaceAll replaces the underscore in each key description of the object with an empty space between the words of the key. */}
                            <h4>{summary[metric]}</h4>                                                                  
                        
                        </div>
                    )
                })}
            </div>

        </section>
    )
}