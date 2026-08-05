import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CalendarCheck, Scale, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section id="home" className="relative scroll-mt-28 overflow-hidden bg-dark-radial pt-36 sm:pt-40 lg:pt-44">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-verdits-teal to-transparent" />
      <div className="section-shell grid min-h-[720px] items-center gap-12 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl"
        >
          <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-verdits-line bg-white/85 px-4 py-2 text-sm font-medium text-verdits-text shadow-sm backdrop-blur">
            <Sparkles size={16} className="text-verdits-teal" />
            Premium legal-tech for modern India
          </div>
          <h1 className="gradient-text text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Justice, Simplified for Everyone.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-verdits-text sm:text-xl">
            Verdits is an AI-powered legal platform that connects individuals with verified lawyers,
            simplifies legal procedures, and empowers law students through internships, mentorship,
            and legal resources.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/role-selection"
              className="button-gradient inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-semibold"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login?role=user"
              className="inline-flex items-center justify-center rounded-full border border-verdits-line bg-white px-7 py-4 text-base font-semibold text-verdits-navy shadow-sm transition hover:border-verdits-teal hover:bg-verdits-mint"
            >
              Book a Consultation
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="glass-panel relative mx-auto max-w-lg rounded-[2rem] p-5"
          >
            <div className="rounded-[1.45rem] border border-verdits-line bg-white p-5">
              <div className="flex items-center justify-between border-b border-verdits-line pb-5">
                <div>
                  <p className="text-sm text-verdits-text">VERDITS network</p>
                  <p className="mt-1 text-xl font-bold text-verdits-navy">Trusted legal help in minutes</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-verdits-gold shadow-glow">
                  <Scale size={24} />
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {[
                  ['Verified lawyer', '100% credential-checked experts', ShieldCheck],
                  ['Availability found', 'Connect in under 15 minutes', CalendarCheck],
                  ['Student research', 'AI-powered legal research & summaries', BookOpen],
                ].map(([title, value, Icon]) => (
                  <div key={title} className="flex items-center gap-4 rounded-2xl border border-verdits-line bg-verdits-section p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-verdits-mint text-verdits-teal">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-verdits-navy">{title}</p>
                      <p className="text-sm text-verdits-text">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-br from-verdits-mint to-white p-5">
                <div className="flex items-center gap-3">
                  <Users className="text-verdits-teal" size={22} />
                  <p className="font-semibold">One ecosystem. Every legal role.</p>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
                  {['Users', 'Lawyers', 'Students'].map((item) => (
                    <div key={item} className="rounded-xl border border-verdits-line bg-white px-3 py-4 text-verdits-text">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
