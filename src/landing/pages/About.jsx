import { motion } from 'framer-motion';
import { Eye, HeartHandshake, Lightbulb, ShieldCheck, Target, Users } from 'lucide-react';
import SectionTitle from '../components/SectionTitle.jsx';
import { fadeIn, staggerContainer, viewport } from '../utils/motion.js';

const values = [
  ['Trust', ShieldCheck, 'Building confidence through verified professionals and transparent guidance.'],
  ['Transparency', Eye, 'Clear communication without hidden complexities or confusing legal jargon.'],
  ['Accessibility', Users, 'Making legal support available to everyone through a digital-first experience.'],
  ['Innovation', Lightbulb, 'Transforming legal services using AI, smart workflows, and modern technology.'],
];

export default function About() {
  return (
    <>
      <section className="relative overflow-hidden bg-dark-radial pt-36 sm:pt-40">
        <div className="section-shell pb-20 pt-10 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="max-w-4xl"
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-verdits-teal">
              About VERDITS
            </p>
            <h1 className="gradient-text text-5xl font-extrabold tracking-tight sm:text-6xl">
              About Verdits
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-verdits-text">
              Verdits is a modern legal technology platform designed to make legal services simple,
              affordable, and accessible. We connect individuals with verified lawyers while providing
              AI-powered legal assistance and opportunities for aspiring law students.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-verdits-section py-20 sm:py-24">
        <div className="section-shell grid gap-6 lg:grid-cols-2">
          {[
            ['Mission', Target, 'To simplify legal services through technology and ensure quality legal assistance is accessible to everyone.'],
            ['Vision', Eye, 'To become India’s most trusted legal ecosystem connecting citizens, lawyers, and future legal professionals on one digital platform.'],
          ].map(([title, Icon, copy]) => (
            <motion.article
              key={title}
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="premium-card p-8"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-verdits-gold shadow-glow">
                <Icon size={25} />
              </div>
              <h2 className="mt-7 text-3xl font-bold">{title}</h2>
              <p className="mt-4 leading-8 text-verdits-text">{copy}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-verdits-bg py-20 sm:py-24">
        <div className="section-shell">
          <SectionTitle
            eyebrow="Core values"
            title="Principles that shape the platform."
            description="Verdits is designed around confidence, inclusion, and a practical respect for how legal work actually happens."
          />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {values.map(([title, Icon, copy]) => (
              <motion.article key={title} variants={fadeIn} className="premium-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdits-mint text-verdits-teal">
                  <Icon size={22} />
                </div>
                <h3 className="mt-6 text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-verdits-text">{copy}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
