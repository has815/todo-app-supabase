'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, CheckCircle, Calendar, Image, Globe, Volume2, Tags, Bell, Smartphone } from 'lucide-react';
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-blue-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative z-10">
          <div className="flex flex-col items-center text-center">
            {/* Animated Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 1.4,
                ease: [0.34, 1.56, 0.64, 1], // Facebook-style bounce
              }}
              className="flex items-center gap-4 sm:gap-6 mb-8"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl ring-4 ring-purple-500/30 transform hover:rotate-6 transition-transform">
                <Check className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
              </div>
              <h1 className="text-6xl sm:text-8xl md:text-9xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent tracking-tight">
                Todo
              </h1>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 max-w-4xl"
            >
              AI Powered Todo List – Sab Kuch Ek Jagah
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-xl sm:text-2xl text-white/80 mb-12 max-w-3xl"
            >
              Voice se task bol do, photo laga do, translate karo, reminders pao – zindagi ko organize karo asaan tareeke se
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link href="/signup">
                <button className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl text-white font-bold text-xl shadow-xl transform hover:scale-105 transition-all duration-300">
                  Get Started Free
                </button>
              </Link>
              <Link href="/signin">
                <button className="px-10 py-5 bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 rounded-2xl text-white font-bold text-xl transition-all duration-300">
                  Login
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Kyun Choose Karein Todo App?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Image, title: "Photo Attach Karo", desc: "Task ke saath photo laga sakte ho – visual memory boost" },
              { icon: Volume2, title: "Voice se Bol Do", desc: "Task bol do, app khud add kar lega + baad mein padh bhi dega" },
              { icon: Globe, title: "Har Language Mein", desc: "Urdu, Hindi, English, Spanish – sab mein translate karo" },
              { icon: Tags, title: "Smart Tags", desc: "Work, Urgent, Personal – ek click mein categorize" },
              { icon: Calendar, title: "Due Date + Reminder", desc: "Date set karo, notification aa jayega" },
              { icon: Bell, title: "Notifications", desc: "Overdue ya due today tasks ke liye alert" },
              { icon: Smartphone, title: "Mobile Friendly", desc: "Phone pe perfect chalta hai – har jagah" },
              { icon: CheckCircle, title: "Beautiful & Fast", desc: "Dark theme, blur effects, super smooth" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all group"
              >
                <feature.icon className="w-12 h-12 text-purple-400 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-white/70">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Kaise Kaam Karta Hai?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: "1", title: "Sign Up / Login", desc: "Email se jaldi sign up karo" },
              { num: "2", title: "Task Add Karo", desc: "Title, photo, tags, date daal do" },
              { num: "3", title: "Voice ya Translate Use Karo", desc: "Bol do ya language change karo" },
              { num: "4", title: "Organized Raho", desc: "Reminders aur complete tasks track karo" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.7 }}
                viewport={{ once: true }}
                className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8 relative overflow-hidden group"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl group-hover:bg-purple-600/40 transition-all" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold mb-6">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-white/70">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/signup">
              <button className="px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl text-white font-bold text-2xl shadow-2xl transform hover:scale-105 transition-all">
                Abhi Shuru Karo
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-32 bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Users Kya Kehte Hain
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Hassan", role: "Designer", quote: "Voice se task add kar leta hoon – time bohot bachta hai!" },
              { name: "Ayesha", role: "Student", quote: "Urdu mein translate kar ke padhta hoon – bohot helpful!" },
              { name: "Ali", role: "Developer", quote: "Image laga ke task yaad rakhna asaan ho gaya hai." },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.7 }}
                viewport={{ once: true }}
                className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
              >
                <p className="text-lg italic mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Common Sawal
          </h2>

          <div className="space-y-6">
            {[
              { q: "Yeh app free hai?", a: "Haan bilkul free hai! Basic features ke liye koi payment nahi." },
              { q: "Images kahan save hoti hain?", a: "Supabase Storage mein secure tareeke se save hoti hain – sirf tum dekh sakte ho." },
              { q: "Voice kis language mein kaam karta hai?", a: "English, Urdu, Hindi sab mein kaam karta hai (browser support ke hisab se)." },
              { q: "Data secure hai?", a: "Haan – Supabase Row Level Security use kar raha hai. Sirf tumhare user ID se data access hota hai." },
              { q: "Mobile pe acha chalega?", a: "Bilkul – pura responsive hai, mobile pe bohot acha experience deta hai." },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold mb-3">{faq.q}</h3>
                <p className="text-white/80">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA + Footer */}
      <section className="py-20 sm:py-32 bg-gradient-to-t from-purple-950 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8">
            Ab Time Waste Karna Band Karo!
          </h2>
          <p className="text-xl text-white/80 mb-12">
            Sign up karo aur apni zindagi ko asaan banao
          </p>

          <Link href="/signup">
            <button className="px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl text-white font-bold text-2xl shadow-2xl transform hover:scale-105 transition-all">
              Start Now – Free!
            </button>
          </Link>

          <footer className="mt-20 text-white/60 text-sm">
            <p>Made with ❤️ by [Haseeb Hassan]</p>
            <p className="mt-2">© {new Date().getFullYear()} Todo App. All rights reserved.</p>
          </footer>
        </div>
      </section>
    </div>
  );
}