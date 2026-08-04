import { motion } from 'framer-motion';
import { Bot, LockKeyhole, MessageCircleMore, ShieldCheck } from 'lucide-react';
import SectionTitle from './SectionTitle.jsx';
import { fadeIn, staggerContainer, viewport } from '../utils/motion.js';

const features = [
  {
    title: 'Verified Lawyers',
    icon: ShieldCheck,
    copy: 'Every lawyer on our platform undergoes a verification process to ensure authenticity and trust.',
  },
  {
    title: 'AI Legal Assistant',
    icon: Bot,
    copy: 'Receive instant legal guidance powered by AI anytime, anywhere.',
  },
  {
    title: 'Secure & Private',
    icon: LockKeyhole,
    copy: 'Your personal information, legal documents, and conversations remain protected with industry-standard security.',
  },
  {
    title: 'Easy Consultation',
    icon: MessageCircleMore,
    copy: 'Book legal consultations quickly through chat, audio, or video.',
  },
];

export default function Features() {
  return (
    <section id="services" className="scroll-mt-28 bg-verdits-bg py-20 sm:py-24">
      <div className="section-shell">
        <SectionTitle
          eyebrow="Why choose Verdits"
          title="A premium legal experience designed for trust and clarity."
          description="Every experience is crafted to make legal support feel secure, simple, and human-centered."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        >
          {features.map(({ title, icon: Icon, copy }) => (
            <motion.article key={title} variants={fadeIn} whileHover={{ y: -6 }} className="premium-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdits-mint text-verdits-teal shadow-teal">
                <Icon size={22} />
              </div>
              <h3 className="mt-6 text-xl font-bold">{title}</h3>
              <p className="mt-3 leading-7 text-verdits-text">{copy}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
