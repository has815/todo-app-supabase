'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Zap, Globe, Tag, Calendar, Volume2, Image as ImageIcon, Shield, Users, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      title: 'Smart Task Management',
      description: 'Add, edit, and complete tasks with a beautiful, intuitive interface that makes productivity effortless.'
    },
    {
      icon: <Volume2 className="w-8 h-8 text-purple-400" />,
      title: 'Text-to-Speech',
      description: 'Listen to your tasks with AI-powered voice. Perfect for multitasking and hands-free productivity.'
    },
    {
      icon: <Globe className="w-8 h-8 text-blue-400" />,
      title: '5-Language Translation',
      description: 'Instantly translate tasks to Urdu, Hindi, English, Spanish, or Japanese with one click.'
    },
    {
      icon: <Tag className="w-8 h-8 text-green-400" />,
      title: 'Smart Tags',
      description: 'Organize with color-coded tags. Work, Personal, Urgent, and more. Create custom tags too!'
    },
    {
      icon: <Calendar className="w-8 h-8 text-orange-400" />,
      title: 'Due Date Tracking',
      description: 'Never miss a deadline with visual status indicators and smart notifications.'
    },
    {
      icon: <ImageIcon className="w-8 h-8 text-pink-400" />,
      title: 'Image Attachments',
      description: 'Add visual context to tasks. Upload images and view them in full-screen modal.'
    }
  ];

  const stats = [
    { value: '1,000+', label: 'Active Users', icon: <Users className="w-6 h-6" /> },
    { value: '10,000+', label: 'Tasks Completed', icon: <CheckCircle2 className="w-6 h-6" /> },
    { value: '5', label: 'Languages', icon: <Globe className="w-6 h-6" /> },
    { value: '4.8', label: 'User Rating', icon: <Star className="w-6 h-6" /> }
  ];

  const testimonials = [
    {
      quote: "Best todo app I've ever used! The translation feature is a game-changer for my international team.",
      author: 'Sarah K.',
      role: 'Project Manager',
      rating: 5
    },
    {
      quote: 'TTS feature helps me stay on track while multitasking. Love the beautiful interface!',
      author: 'Ahmed R.',
      role: 'Software Developer',
      rating: 5
    },
    {
      quote: 'Simple, powerful, and free. Everything I needed in one place. Highly recommend!',
      author: 'Lisa M.',
      role: 'Designer',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'Is it really free?',
      answer: 'Yes! All features are 100% free forever. No hidden costs, no credit card required.'
    },
    {
      question: 'Do I need to download anything?',
      answer: "No, it's a web app that works in any browser. Access from anywhere, anytime."
    },
    {
      question: 'How secure is my data?',
      answer: 'Bank-level encryption with Supabase. Your data is private and only accessible by you.'
    },
    {
      question: 'Which languages are supported?',
      answer: 'English, Urdu, Hindi, Spanish, and Japanese with instant one-click translation.'
    },
    {
      question: 'Can I attach files?',
      answer: 'Yes! You can attach images to any task with thumbnail preview and full-screen view.'
    },
    {
      question: 'Do I get notifications?',
      answer: 'Yes! Browser notifications remind you 1 hour before tasks are due.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Todo App
              </span>
            </div>

            <div className="flex gap-3">
              <Link
                href="/signin"
                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition border border-white/10"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full border border-white/20">
            <span className="text-white/80 text-sm">✨ Trusted by 1,000+ users worldwide</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight">
            Organize Your Life,
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Effortlessly
            </span>
          </h1>

          <p className="text-xl text-white/80 mb-10 max-w-3xl mx-auto">
            The smart todo app with AI-powered features you'll actually use. 
            Text-to-speech, multi-language support, and beautiful design.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg transition shadow-2xl flex items-center gap-2 group"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="/signin"
              className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-lg transition border border-white/10 backdrop-blur-lg"
            >
              Sign In
            </Link>
          </div>

          <p className="text-white/60 text-sm mt-6">
            No credit card required • Free forever • 5-minute setup
          </p>

          {/* Hero Image/Mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900 via-transparent to-transparent z-10" />
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-8 border border-white/10">
                <div className="text-white/60 text-sm mb-4">📋 Your Tasks Dashboard</div>
                <div className="space-y-3">
                  {[
                    { text: 'Complete project proposal', tag: 'Work', done: true },
                    { text: 'Buy groceries for dinner', tag: 'Shopping', done: false },
                    { text: 'Team meeting at 3 PM', tag: 'Important', done: false }
                  ].map((task, i) => (
                    <div key={i} className="bg-black/30 backdrop-blur-lg rounded-lg p-4 flex items-center gap-3 border border-white/10">
                      <div className={`w-5 h-5 rounded-full ${task.done ? 'bg-green-500' : 'bg-white/20'} border-2 border-white/40`} />
                      <span className={`text-white flex-1 ${task.done ? 'line-through opacity-60' : ''}`}>{task.text}</span>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                        {task.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Features That Matter
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Everything you need to stay organized, productive, and on top of your tasks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:scale-105 transition shadow-xl group"
              >
                <div className="mb-4 group-hover:scale-110 transition">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-white/70">Get started in 3 easy steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Sign In',
                description: 'Click "Get Started" and sign in with Google. No forms, instant access.',
                icon: <Shield className="w-12 h-12 text-green-400" />
              },
              {
                step: '2',
                title: 'Create Tasks',
                description: 'Add your first task, set due date, add tags, and attach images if needed.',
                icon: <Zap className="w-12 h-12 text-yellow-400" />
              },
              {
                step: '3',
                title: 'Stay Organized',
                description: 'Get notifications, use filters, translate tasks, and mark them complete.',
                icon: <CheckCircle2 className="w-12 h-12 text-blue-400" />
              }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                  {step.icon}
                </div>
                <div className="text-4xl font-bold text-purple-400 mb-3">{step.step}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-white/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10 hover:scale-105 transition shadow-xl">
                <div className="flex justify-center mb-4 text-purple-400">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Loved by Thousands
            </h2>
            <p className="text-xl text-white/70">See what our users are saying</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/90 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="text-white font-semibold">{testimonial.author}</div>
                  <div className="text-white/60 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-white/70">Free forever. No hidden costs.</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Free Plan</h3>
              <div className="text-5xl font-bold text-white mb-2">$0</div>
              <div className="text-white/60">Forever</div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                'Unlimited tasks',
                'Text-to-speech',
                '5-language translation',
                'Smart tags & filters',
                'Image attachments',
                'Browser notifications',
                'Due date tracking',
                'Beautiful interface'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="w-full block text-center px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg transition shadow-xl"
            >
              Get Started Free
            </Link>

            <p className="text-center text-white/60 text-sm mt-4">
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-3">{faq.question}</h3>
                <p className="text-white/70">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-6">
            Ready to Get Organized? 🚀
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join 1,000+ users staying productive with our smart todo app
          </p>

          <Link
            href="/signup"
            className="inline-block px-12 py-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl transition shadow-2xl hover:scale-105"
          >
            Get Started Free →
          </Link>

          <p className="text-white/60 mt-6">
            No credit card • Free forever • 5-minute setup
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-xl border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Todo App</span>
              </div>
              <p className="text-white/60 text-sm">
                Organize your life with AI-powered features and beautiful design.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
            <p>© 2024 Todo App. Made with ❤️ by Hassan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}