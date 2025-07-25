import React, { useState } from 'react'
import Head from 'next/head'
import MarketingHeader from '../src/components/marketing/MarketingHeader'
import MarketingFooter from '../src/components/marketing/MarketingFooter'

/**
 * Enterprise page - completely independent static page
 * Styles isolated from main app to avoid conflicts
 */
export default function EnterprisePage() {
  const [activeTab, setActiveTab] = useState('overview')

  const useCases = [
    {
      title: 'Financial Services',
      description: 'Automate document processing, risk analysis, and customer service with AI-powered agents.',
      roi: '40% cost reduction',
      timeToValue: '2-4 weeks',
      icon: '🏦',
      metrics: ['95% accuracy in document processing', '60% faster compliance reporting', '24/7 customer support automation']
    },
    {
      title: 'Healthcare',
      description: 'Streamline clinical workflows, automate medical record analysis, and enhance patient care.',
      roi: '35% efficiency gain',
      timeToValue: '3-6 weeks',
      icon: '🏥',
      metrics: ['80% reduction in manual data entry', '45% faster diagnosis support', 'HIPAA-compliant AI processing']
    },
    {
      title: 'Manufacturing',
      description: 'Optimize supply chains, predict maintenance needs, and automate quality control processes.',
      roi: '50% operational efficiency',
      timeToValue: '4-8 weeks',
      icon: '🏭',
      metrics: ['30% reduction in downtime', '25% inventory optimization', 'Real-time quality monitoring']
    },
    {
      title: 'Retail & E-commerce',
      description: 'Personalize customer experiences, automate inventory management, and optimize pricing strategies.',
      roi: '45% revenue increase',
      timeToValue: '1-3 weeks',
      icon: '🛒',
      metrics: ['65% improvement in conversion rates', '40% better inventory turnover', 'Automated customer segmentation']
    }
  ]

  const enterpriseFeatures = [
    {
      category: 'Security & Compliance',
      features: [
        'SOC 2 Type II certification',
        'GDPR and CCPA compliance',
        'End-to-end encryption',
        'Role-based access control',
        'Comprehensive audit logging',
        'Multi-factor authentication'
      ],
      icon: '🔐'
    },
    {
      category: 'Scalability & Performance',
      features: [
        'Auto-scaling infrastructure',
        '99.9% uptime SLA',
        'Global CDN deployment',
        'Load balancing across regions',
        'Real-time monitoring',
        'Disaster recovery'
      ],
      icon: '📈'
    },
    {
      category: 'Integration & Support',
      features: [
        'REST API and webhooks',
        'SSO integration',
        'Dedicated success manager',
        '24/7 enterprise support',
        'Custom training programs',
        'Professional services'
      ],
      icon: '🔧'
    }
  ]

  return (
    <>
      <Head>
        <title>Enterprise - iapro.ai</title>
        <meta name="description" content="Deploy production-ready AI solutions that deliver measurable ROI with enterprise-grade security" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="enterprise-page min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <MarketingHeader />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span>Trusted by 500+ Enterprise Customers</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
                    Transform Your Business with
                    <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent"> Enterprise AI</span>
                  </h1>
                  
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Deploy production-ready AI solutions that deliver measurable ROI. 
                    Our integrated platform reduces implementation time by 80% while ensuring enterprise-grade security.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <a 
                      href="mailto:sales@iapro.ai?subject=Enterprise%20AI%20Platform%20Inquiry&body=Hi%2C%20I'm%20interested%20in%20learning%20more%20about%20your%20enterprise%20AI%20platform%20solutions." 
                      className="enterprise-cta bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold py-4 px-8 rounded-full hover:shadow-xl transition-all duration-300 hover:scale-105 text-center no-underline"
                    >
                      Contact Sales
                    </a>
                    <a 
                      href="mailto:sales@iapro.ai?subject=Demo%20Request&body=Hi%2C%20I'd%20like%20to%20schedule%20a%20demo%20of%20your%20enterprise%20AI%20platform."
                      className="enterprise-cta border-2 border-gray-300 text-gray-700 font-bold py-4 px-8 rounded-full hover:bg-gray-50 transition-all duration-300 text-center no-underline"
                    >
                      Schedule Demo
                    </a>
                  </div>
                  
                  <div className="flex items-center space-x-8 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                      <span>No upfront costs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                      <span>30-day pilot program</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                      <span>Dedicated support</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Average Enterprise Results</h3>
                      <p className="text-gray-600">Within first 6 months</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">40%</div>
                        <div className="text-gray-600 text-sm">Cost Reduction</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">3x</div>
                        <div className="text-gray-600 text-sm">Faster Processing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
                        <div className="text-gray-600 text-sm">Accuracy Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600 mb-2">60%</div>
                        <div className="text-gray-600 text-sm">Time Savings</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Industry Use Cases */}
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Industry Solutions</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Proven AI solutions delivering measurable results across industries
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {useCases.map((useCase, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="text-4xl">{useCase.icon}</div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{useCase.title}</h3>
                        <div className="flex space-x-4 text-sm">
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{useCase.roi}</span>
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{useCase.timeToValue}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">{useCase.description}</p>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 mb-3">Key Metrics:</h4>
                      {useCase.metrics.map((metric, metricIndex) => (
                        <div key={metricIndex} className="flex items-center space-x-2">
                          <span className="text-emerald-500">▶</span>
                          <span className="text-gray-600 text-sm">{metric}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Enterprise Features */}
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Enterprise-Grade Features</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Built for the most demanding enterprise requirements
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {enterpriseFeatures.map((category, index) => (
                  <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="text-4xl">{category.icon}</div>
                      <h3 className="text-2xl font-bold text-gray-900">{category.category}</h3>
                    </div>
                    
                    <ul className="space-y-3">
                      {category.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <span className="text-emerald-500">✓</span>
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-purple-600/20"></div>
            <div className="max-w-4xl mx-auto text-center px-6 relative">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Start Your AI Transformation Today
              </h2>
              <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
                Join industry leaders who've already transformed their operations with our enterprise AI platform
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-white mb-2">30 Days</div>
                    <div className="text-emerald-200">Pilot Program</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-2">$0</div>
                    <div className="text-emerald-200">Setup Costs</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-2">24/7</div>
                    <div className="text-emerald-200">Expert Support</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="mailto:sales@iapro.ai?subject=Enterprise%20Consultation%20Request&body=Hi%2C%20I'd%20like%20to%20schedule%20an%20enterprise%20consultation%20for%20our%20organization." 
                  className="enterprise-cta bg-white text-emerald-600 font-bold py-4 px-8 rounded-full hover:shadow-xl transition-all duration-300 hover:scale-105 text-center no-underline"
                >
                  Schedule Enterprise Consultation
                </a>
                <a 
                  href="mailto:sales@iapro.ai?subject=ROI%20Report%20Request&body=Hi%2C%20I'd%20like%20to%20receive%20the%20ROI%20report%20for%20your%20enterprise%20AI%20platform."
                  className="enterprise-cta border-2 border-white text-white font-bold py-4 px-8 rounded-full hover:bg-white/10 transition-all duration-300 text-center no-underline"
                >
                  Request ROI Report
                </a>
              </div>
            </div>
          </section>
        </main>
        
        <MarketingFooter />

        <style jsx global>{`
          /* Enterprise page styles, isolated from main app */
          .enterprise-page {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
          }
          
          .enterprise-page * {
            box-sizing: border-box;
          }
          
          .enterprise-cta {
            text-decoration: none;
            display: inline-block;
          }
          
          .enterprise-cta:hover {
            text-decoration: none;
          }
        `}</style>
      </div>
    </>
  )
}