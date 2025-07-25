interface Demo {
  user: string
  action: string
  time: string
  color: string
  metric?: string
  category: string
  icon: string
}

interface LiveActivityProps {
  demos: Demo[]
  activeDemo: number
  className?: string
}

/**
 * Marketing homepage live activity component
 * Isolated styles to avoid conflicts with main app
 */
export default function LiveActivity({ demos, activeDemo, className = "" }: LiveActivityProps) {
  return (
    <div className={`live-activity col-span-1 lg:col-span-5 bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/40 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center text-gray-800">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
          Real-time User Value
        </h3>
        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
          Live Impact
        </div>
      </div>
      
      <div className="space-y-2">
        {demos.map((demo, i) => (
          <div 
            key={i} 
            className={`flex items-center space-x-3 p-2 rounded-xl transition-all duration-500 ${
              i === activeDemo 
                ? 'bg-gradient-to-r from-purple-50 to-blue-50 scale-105 shadow-sm border border-purple-200' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className={`w-6 h-6 bg-gradient-to-r ${demo.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
              <span className="text-xs">{demo.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-1">
                <div className="text-xs font-semibold text-gray-800">{demo.user}</div>
                <div className="text-xs text-gray-500 bg-gray-200 px-1 rounded text-[10px]">{demo.category}</div>
              </div>
              <div className="text-xs text-gray-600">{demo.action}</div>
              {demo.metric && (
                <div className="text-xs text-green-600 font-medium">{demo.metric}</div>
              )}
            </div>
            <div className="text-xs text-gray-400 font-medium">{demo.time}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Value Created Today</span>
          <span className="text-green-600 font-semibold">$47,392 saved</span>
        </div>
      </div>

      <style jsx>{`
        .live-activity {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .live-activity * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}