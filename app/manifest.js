export default function manifest() {
    return {
        name: "Expenny",
        short_name: "Expenny",
        description: "Track subscriptions, upcoming renewals, and savings opportunities.",
        start_url: "/dashboard",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        icons: [
            {
                src: "/favicon.ico",
                sizes: "any",
                type: "image/x-icon",
            },
        ],
    }
}
