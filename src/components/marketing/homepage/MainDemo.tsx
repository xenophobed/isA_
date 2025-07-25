import { useState, useEffect } from 'react'

interface MainDemoProps {
  className?: string
}

const demos = [
  {
    icon: '💻',
    title: "Code Generation",
    input: "Create a React component with TypeScript",
    output: "export const Button: React.FC<Props> = ({ children, onClick }) => {\n  return <button onClick={onClick}>{children}</button>\n}",
    color: "from-blue-500 to-cyan-500",
    category: "Multi-Application"
  },
  {
    icon: '🎨',
    title: "Image Creation",
    input: "Generate a modern logo for tech startup",
    output: "🎨 Creating SVG logo with gradient colors...\n✨ Logo generated with brand guidelines",
    color: "from-pink-500 to-purple-500",
    category: "Visual Creator"
  },
  {
    icon: '📊',
    title: "Data Analysis",
    input: "Analyze Q4 sales data and create insights",
    output: "📊 Processing 10,000 records...\n📈 Revenue up 23%, key growth in mobile segment",
    color: "from-green-500 to-emerald-500",
    category: "Analytics"
  },
  {
    icon: '🛒',
    title: "E-commerce Setup",
    input: "Set up online store with payment integration",
    output: "🛍️ Creating product catalog...\n💳 Stripe integration configured\n📦 Inventory system ready",
    color: "from-orange-500 to-red-500",
    category: "E-commerce"
  },
  {
    icon: '⚡',
    title: "Automated Planning",
    input: "Plan a mobile app launch campaign",
    output: "📋 Breaking down into 12 tasks...\n🎯 Timeline: 6 weeks\n🤖 Assigned to marketing agents",
    color: "from-violet-500 to-purple-500",
    category: "Automation"
  }
]

/**
 * Marketing homepage main demo component
 * Isolated styles to avoid conflicts with main app
 */
export default function MainDemo({ className = "" }: MainDemoProps) {
  const [currentDemo, setCurrentDemo] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentDemo((prev) => (prev + 1) % demos.length)
        setIsAnimating(false)
      }, 500)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const demo = demos[currentDemo]

  return (
    <div 
      className={`main-demo col-span-1 lg:col-span-7 rounded-2xl overflow-hidden relative group shadow-xl ${className}`}
      style={{
        background: 'linear-gradient(to bottom right, #111827, #581c87, #1e3a8a)',
        minHeight: '400px'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-blue-600/30"></div>
      
      <div className="relative p-6 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium">Live AI Demo</span>
            <div className={`bg-gradient-to-r ${demo.color} text-white px-2 py-1 rounded-full text-xs font-medium`}>
              {demo.category}
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm w-10 h-10 rounded-full hover:bg-white/30 transition-all group-hover:scale-110 duration-300 flex items-center justify-center">
            <span className="text-white text-sm">▶️</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-white text-base">{demo.icon}</span>
          <span className="text-white text-sm font-medium">{demo.title}</span>
        </div>
        
        <div className={`space-y-3 transition-all duration-500 ${isAnimating ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'}`}>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-white/70 text-xs mb-1 font-medium">Input:</div>
            <div className="text-white font-mono text-xs">{demo.input}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-white/70 text-xs mb-1 font-medium">AI Output:</div>
            <div className="text-green-300 font-mono text-xs whitespace-pre-line">{demo.output}</div>
          </div>
        </div>
        
        <div className="flex space-x-1 mt-4">
          {demos.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentDemo ? 'bg-white flex-1' : 'bg-white/30 w-1'
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .main-demo {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .main-demo * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}