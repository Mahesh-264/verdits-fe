import { motion } from 'framer-motion';
import { fadeIn, viewport } from '../utils/motion.js';

export default function SectionTitle({ eyebrow, title, description, align = 'center' }) {
  const centered = align === 'center';

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ duration: 0.6 }}
      className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}
    >
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-verdits-teal">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-verdits-navy sm:text-4xl lg:text-5xl">{title}</h2>
      {description && (
        <p className="mt-5 text-base leading-8 text-verdits-text sm:text-lg">{description}</p>
      )}
    </motion.div>
  );
}
