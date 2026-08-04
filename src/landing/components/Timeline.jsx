import { motion } from 'framer-motion';
import { CheckCircle2, CircleUserRound, Handshake, UserPlus } from 'lucide-react';
import SectionTitle from './SectionTitle.jsx';
import { fadeIn, viewport } from '../utils/motion.js';

const steps = [
  {
    label: 'Create Your Account',
    description: 'Users can register as individuals, lawyers, or law students.',
    icon: UserPlus,
  },
  {
    label: 'Verification',
    description: 'Lawyers complete professional verification while users complete basic registration.',
    icon: CircleUserRound,
  },
  {
    label: 'Choose Your Service',
    description: 'Book a lawyer, consult the AI assistant, explore internships, or access legal resources.',
    icon: Handshake,
  },
  {
    label: 'Resolve',
    description: 'Receive trusted legal guidance and manage your legal journey with confidence.',
    icon: CheckCircle2,
  },
];

export default function Timeline({ title = 'How We Work', description }) {
  return (
    <section id="how-we-work" className="scroll-mt-28 bg-verdits-bg py-20 sm:py-24">
      <div className="section-shell">
        <SectionTitle
          eyebrow={title}
          title="A clear, guided path from first question to trusted resolution."
          description={
            description ||
            'Verdits keeps onboarding simple, role-based, and action-oriented so every visitor can move forward with confidence.'
          }
        />
        <div className="relative mt-14">
          <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-verdits-navy via-verdits-mint to-verdits-teal lg:left-0 lg:top-1/2 lg:h-px lg:w-full" />
          <div className="grid gap-6 lg:grid-cols-4">
            {steps.map(({ label, description: copy, icon: Icon }, index) => (
              <motion.div
                key={label}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative pl-16 lg:pl-0 lg:pt-14"
              >
                <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border border-verdits-line bg-white text-verdits-teal shadow-teal transition group-hover:bg-verdits-navy group-hover:text-verdits-gold lg:left-0 lg:top-0">
                  <Icon size={21} />
                </div>
                <div className="premium-card h-full p-6 transition duration-300 group-hover:border-verdits-teal group-hover:shadow-[0_24px_50px_rgba(8,8,8,0.16)]">
                  <p className="text-sm font-semibold text-verdits-teal">Step {index + 1}</p>
                  <h3 className="mt-2 text-xl font-bold">{label}</h3>
                  <p className="mt-3 text-sm leading-7 text-verdits-text">{copy}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
