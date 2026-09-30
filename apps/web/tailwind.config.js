export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    ink: "#081626",
                    sky: "#0ea5e9",
                    cyan: "#1ecbe1",
                    gold: "#f59e0b",
                    sand: "#f4efe4"
                }
            },
            boxShadow: {
                glow: "0 30px 80px rgba(14, 165, 233, 0.18)"
            },
            animation: {
                float: "float 9s ease-in-out infinite",
                drift: "drift 14s linear infinite",
                pulseSlow: "pulseSlow 6s ease-in-out infinite"
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-12px)" }
                },
                drift: {
                    "0%": { transform: "translateX(0px)" },
                    "50%": { transform: "translateX(12px)" },
                    "100%": { transform: "translateX(0px)" }
                },
                pulseSlow: {
                    "0%, 100%": { opacity: "0.7" },
                    "50%": { opacity: "1" }
                }
            }
        }
    },
    plugins: []
};
