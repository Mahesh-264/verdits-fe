import { motion } from 'framer-motion';
import { GraduationCap, Scale, UserRound } from 'lucide-react';
import SectionTitle from './SectionTitle.jsx';
import { fadeIn, staggerContainer, viewport } from '../utils/motion.js';

const audiences = [
  {
    title: 'Lawyer',
    icon: Scale,
    lines: ['Offer legal services, manage cases, and connect directly with clients in need of your expertise.'],
  },
  {
    title: 'Student',
    icon: GraduationCap,
    lines: ['Learn, research, and collaborate on legal studies with verified legal professionals.'],
  },
  {
    title: 'User',
    icon: UserRound,
    lines: ['Seek consultations, discover certified lawyers, and resolve your legal cases effortlessly.'],
  },
];

export default function PlatformCards() {
  return (
    <section id="about" className="scroll-mt-28 bg-verdits-section py-20 sm:py-24">
      <div className="section-shell">
        <SectionTitle
          eyebrow="Choose your role"
          title="Select your primary role to continue."
          description="Each role provides specialized tools tailored to your precise needs."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {audiences.map(({ title, icon: Icon, lines }) => (
            <motion.article
              key={title}
              variants={fadeIn}
              transition={{ duration: 0.55 }}
              whileHover={{ y: -8, scale: 1.015 }}
              className="premium-card p-8 text-center"
            >
              <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-verdits-mint text-verdits-teal">
                <Icon size={25} />
              </div>
              <h3 className="text-2xl font-bold text-verdits-navy">{title}</h3>
              <div className="mt-5 grid gap-3">
                {lines.map((line) => (
                  <p key={line} className="mx-auto max-w-64 text-sm leading-6 text-verdits-text">{line}</p>
                ))}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
