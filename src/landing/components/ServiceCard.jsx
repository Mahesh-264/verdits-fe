import { motion } from 'framer-motion';

export default function ServiceCard({ title, items, icon: Icon }) {
  return (
    <motion.article
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className="premium-card p-7"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verdits-navy text-verdits-gold shadow-glow">
        <Icon size={25} />
      </div>
      <h3 className="mt-7 text-2xl font-bold">{title}</h3>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div key={item} className="rounded-xl border border-verdits-line bg-verdits-section px-4 py-3 text-verdits-text">
            {item}
          </div>
        ))}
      </div>
    </motion.article>
  );
}
