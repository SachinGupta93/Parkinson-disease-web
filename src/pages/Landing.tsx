import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Mic, ShieldCheck, UserCheck, ArrowRight, Sparkles, MessageCircle, ActivitySquare } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="md:w-1/2 mb-8 md:mb-0"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Early Detection of{' '}
              <span className="text-indigo-600">Parkinson's Disease</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Using advanced voice analysis technology to help detect early signs
              of Parkinson's disease. Our AI-powered platform provides accurate
              and non-invasive screening through voice analysis.
            </p>
            <div className="flex space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/signup"
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200"
                >
                  Get Started
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-medium border border-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:w-1/2"
          >
            <img
              src="/hero-image.svg"
              alt="Voice Analysis"
              className="w-full h-auto"
            />
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 mb-12"
          >
            Why Choose Our Platform?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center text-gray-900 mb-12"
        >
          How It Works
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-8"
          >
            Ready to Start Your Voice Analysis?
          </motion.h2>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/signup"
              className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
            >
              Get Started Now
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Floating Feedback Button */}
      <Link
        to="/feedback"
        className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-purple-600 to-teal-500 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-5 w-5" />
        Give Feedback
      </Link>
    </div>
  );
};

const features = [
  {
    title: 'Advanced AI Technology',
    description:
      'Our platform uses state-of-the-art machine learning algorithms to analyze voice patterns with high accuracy.',
    icon: <Brain className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: 'Non-Invasive Screening',
    description:
      'Simple voice recording process that can be done from the comfort of your home.',
    icon: <Mic className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: 'Privacy & Security',
    description:
      'Your data is encrypted and never shared. We prioritize your privacy and security at every step.',
    icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
  },
];

const steps = [
  {
    title: 'Sign Up',
    description: 'Create your free account to get started.',
    icon: <UserCheck className="w-8 h-8 text-indigo-600 mx-auto" />,
  },
  {
    title: 'Record Your Voice',
    description: 'Follow the instructions to record a short voice sample.',
    icon: <Mic className="w-8 h-8 text-indigo-600 mx-auto" />,
  },
  {
    title: 'AI Analysis',
    description: 'Our AI analyzes your voice for early signs of Parkinson’s.',
    icon: <Sparkles className="w-8 h-8 text-indigo-600 mx-auto" />,
  },
  {
    title: 'Get Results',
    description: 'Receive a detailed, easy-to-understand report instantly.',
    icon: <ActivitySquare className="w-8 h-8 text-indigo-600 mx-auto" />,
  },
];

export default Landing; 