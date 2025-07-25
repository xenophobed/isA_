import { useState, useEffect } from 'react'

interface SocialProofProps {
  className?: string
}

const testimonials = [
  {
    name: "Sarah Chen",
    title: "Product Manager",
    company: "TechCorp",
    quote: "Automated our entire product launch workflow. Saved 25 hours per week.",
    metric: "25hrs saved/week",
    category: "Automation",
    avatar: "SC"
  },
  {
    name: "Michael Torres",
    title: "Data Scientist", 
    company: "DataFlow",
    quote: "The memory system remembers all my analysis contexts. Perfect continuity.",
    metric: "100% context retention",
    category: "Memory",
    avatar: "MT"
  },
  {
    name: "Lisa Wang",
    title: "E-commerce Director",
    company: "ShopNext",
    quote: "AI agents handle everything from inventory to customer service seamlessly.",
    metric: "3x faster operations",
    category: "Adaptive",
    avatar: "LW"
  }
]

const successMetrics = [
  { label: "Teams using daily", value: "50K+", icon: '👥' },
  { label: "Hours automated", value: "2.5M", icon: '⏱️' },
  { label: "Efficiency boost", value: "340%", icon: '📈' },
  { label: "Success rate", value: "99.8%", icon: '🏆' }
]

/**
 * Marketing homepage social proof component
 * Isolated styles to avoid conflicts with main app
 */
export default function SocialProof({ className = "" }: SocialProofProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const currentTestimonial = testimonials[activeTestimonial]

  return (
    <div className={`social-proof mt-6 space-y-6 ${className}`}>
      {/* Success Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {successMetrics.map((metric, index) => (
          <div key={index} className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm">
            <div className="text-2xl mb-2">{metric.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            <div className="text-xs text-gray-700">{metric.label}</div>
          </div>
        ))}
      </div>
      
      {/* User Testimonial */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {currentTestimonial.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-purple-600">💬</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                {currentTestimonial.category}
              </span>
            </div>
            <p className="text-gray-800 text-sm mb-3 leading-relaxed">
              "{currentTestimonial.quote}"
            </p>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{currentTestimonial.name}</div>
                <div className="text-gray-700 text-xs">{currentTestimonial.title} at {currentTestimonial.company}</div>
              </div>
              <div className="text-right">
                <div className="text-green-600 font-bold text-sm">{currentTestimonial.metric}</div>
                <div className="text-gray-600 text-xs">Impact achieved</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Testimonial indicators */}
        <div className="flex justify-center space-x-2 mt-4">
          {testimonials.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeTestimonial ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Video Demo CTA */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
          <span>▶️</span>
          <span className="text-sm font-semibold">Watch 2-min Demo</span>
        </div>
        <div className="text-xs text-gray-600 mt-2">See all 6 advantages in action</div>
      </div>

      <style jsx>{`
        .social-proof {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .social-proof * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}