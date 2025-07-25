interface FeatureCardsProps {
  className?: string
  id?: string
}

const features = [
  {
    icon: '💬',
    title: "Multi-Application Support",
    description: "Text generation, image creation, file analysis, personal assistant, digital media, data analysis, deep search",
    colorClass: "from-purple-500 to-purple-600",
    textColor: "text-purple-100"
  },
  {
    icon: '⚡',
    title: "Automated Planning",
    description: "Complex plan generation, AGI agents, web automation, 100+ tool integrations",
    colorClass: "from-blue-500 to-blue-600",
    textColor: "text-blue-100"
  },
  {
    icon: '🗄️',
    title: "Comprehensive Memory",
    description: "Fact, procedure, episodic, working, session, semantic memory systems",
    colorClass: "from-green-500 to-green-600",
    textColor: "text-green-100"
  },
  {
    icon: '🤖',
    title: "Adaptive Agent System",
    description: "Automatically selects optimal agents for your tasks",
    colorClass: "from-pink-500 to-pink-600",
    textColor: "text-pink-100"
  },
  {
    icon: '🧠',
    title: "Proactive Task Management",
    description: "Actively monitors and executes planned tasks",
    colorClass: "from-indigo-500 to-indigo-600",
    textColor: "text-indigo-100"
  },
  {
    icon: '🛒',
    title: "E-commerce Support",
    description: "Complete e-commerce solution integration",
    colorClass: "from-orange-500 to-orange-600",
    textColor: "text-orange-100"
  }
]

/**
 * Marketing homepage feature cards component
 * Isolated styles to avoid conflicts with main app
 */
export default function FeatureCards({ className = "", id }: FeatureCardsProps) {
  return (
    <>
      {features.map((feature, index) => (
        <div 
          key={index}
          id={index === 0 ? id : undefined}
          className={`feature-card col-span-1 lg:col-span-2 bg-gradient-to-br ${feature.colorClass} rounded-2xl p-4 text-white transform hover:scale-105 transition-all duration-300 shadow-lg ${className}`}
          style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))` }}
        >
          <div className="text-2xl mb-2">{feature.icon}</div>
          <h3 className="text-sm font-bold mb-1 text-white">{feature.title}</h3>
          <p className="text-white/90 text-xs leading-relaxed">{feature.description}</p>

          <style jsx>{`
            .feature-card {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .feature-card * {
              box-sizing: border-box;
            }
          `}</style>
        </div>
      ))}
    </>
  )
}