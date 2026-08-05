import { Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import ContactForm from '../components/ContactForm.jsx';
import Features from '../components/Features.jsx';
import Hero from '../components/Hero.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import Timeline from '../components/Timeline.jsx';

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mahesh-babu-bonthala', Icon: Linkedin },
  { label: 'WhatsApp', href: 'https://wa.me/918688332369', Icon: FaWhatsapp },
  { label: 'Instagram', href: 'https://www.instagram.com/_verdits/?hl=en', Icon: Instagram },
];

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Timeline />
      <ContactSection />
    </>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-28 bg-verdits-bg py-20 sm:py-24">
      <div className="section-shell">
        <SectionTitle
          eyebrow="Contact"
          title="Ready to simplify a legal question?"
          description="Reach out for product access, partnerships, lawyer onboarding, student programs, or early platform conversations."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="premium-card p-7 sm:p-8"
          >
            <h2 className="text-3xl font-bold">Contact Information</h2>
            <p className="mt-4 leading-8 text-verdits-text">
              VERDITS is building a more connected legal ecosystem for users, lawyers, and students.
            </p>
            <div className="mt-8 grid gap-4">
              <Info icon={Mail} label="Email" value="verdittss@gmail.com" />
              <Info icon={Phone} label="Phone" value="8688332369" />
              <Info icon={MapPin} label="Location" value="India" />
            </div>
            <div className="mt-8 flex gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-verdits-line bg-white text-verdits-text transition hover:border-verdits-teal hover:bg-verdits-goldSoft hover:text-verdits-navy"
                  aria-label={label}
                >
                  <Icon size={19} />
                </a>
              ))}
            </div>
          </motion.aside>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-verdits-line bg-verdits-section p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-verdits-mint text-verdits-teal">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-verdits-text">{label}</p>
        <p className="font-semibold text-verdits-navy">{value}</p>
      </div>
    </div>
  );
}
