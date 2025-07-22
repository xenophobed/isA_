import React from 'react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800">
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-blue-500/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="text-center max-w-md">
          {/* Logo/Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded mx-auto"></div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI Agent SDK
            </span>
          </h1>
          
          <h2 className="text-xl md:text-2xl text-gray-300 mb-2 animate-fade-in-delay">
            Your Intelligent Assistant
          </h2>
          
          <p className="text-gray-400 mb-8 animate-fade-in-delay-2">
            Unlock the power of AI with multiple specialized agents.<br />
            Chat, create, analyze, and more - all in one place.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in-delay-3">
            {[
              { icon: '🎨', text: 'Image Generation' },
              { icon: '💬', text: 'Smart Chat' },
              { icon: '📊', text: 'Data Analysis' },
              { icon: '🔍', text: 'AI Search' }
            ].map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all">
                <div className="text-2xl mb-1">{feature.icon}</div>
                <div className="text-xs text-gray-300">{feature.text}</div>
              </div>
            ))}
          </div>

          {/* Login Button */}
          <button
            onClick={onLogin}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 animate-fade-in-delay-4"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Sign In to Continue</span>
            </span>
            
            {/* Button Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur-xl"></div>
          </button>

          {/* Security Notice */}
          <p className="text-xs text-gray-500 mt-6 animate-fade-in-delay-5">
            🔒 Secure authentication powered by Auth0
          </p>
        </div>
      </div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent"></div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.2s both;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in 0.8s ease-out 0.4s both;
        }
        
        .animate-fade-in-delay-3 {
          animation: fade-in 0.8s ease-out 0.6s both;
        }
        
        .animate-fade-in-delay-4 {
          animation: fade-in 0.8s ease-out 0.8s both;
        }
        
        .animate-fade-in-delay-5 {
          animation: fade-in 0.8s ease-out 1s both;
        }
        
        .bg-grid-pattern {
          background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};