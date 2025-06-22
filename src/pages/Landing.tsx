import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2, FileAudio, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: FileAudio,
    title: 'Audio Processing',
    description: 'Upload and process call recordings with advanced AI technology for accurate transcription and analysis.'
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Analysis',
    description: 'Get detailed insights into call performance using state-of-the-art language models and analytics.'
  },
  {
    icon: BarChart2,
    title: 'Performance Metrics',
    description: 'Track agent performance with comprehensive metrics, charts, and actionable recommendations.'
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with end-to-end encryption and reliable cloud infrastructure.'
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-y-0 w-full bg-gradient-to-r from-blue-50 to-blue-100 transform -skew-y-6 origin-top-left" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Allied Global Call Analytics
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your call center operations with AI-powered insights and real-time analytics
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/auth">
                <Button size="lg" className="group">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Powerful Features for Call Center Excellence
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to optimize your call center performance
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="relative group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur" />
                <div className="relative bg-white p-6 rounded-xl">
                  <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Call Center?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join leading companies using Allied Global Call Analytics to improve their customer service quality
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 group"
            >
              Start Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}