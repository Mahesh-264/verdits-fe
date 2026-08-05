import { Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ContactForm from '../components/ContactForm.jsx';
import SectionTitle from '../components/SectionTitle.jsx';

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mahesh-babu-bonthala', Icon: Linkedin },
  { label: 'WhatsApp', href: 'https://wa.me/918688332369', Icon: FaWhatsapp },
  { label: 'Instagram', href: 'https://www.instagram.com/_verdits/?hl=en', Icon: Instagram },
];

export default function Contact() {
  return (
    <>
      <section className="bg-dark-radial pt-36 sm:pt-40">
        <div className="section-shell pb-16 pt-10">
          <SectionTitle
            align="left"
            eyebrow="Contact"
            title="Need legal assistance?"
            description="Book your consultation with trusted legal professionals today and discover how Verdits can simplify your legal journey."
          />
        </div>
      </section>
      <section className="bg-verdits-section py-20 sm:py-24">
        <div className="section-shell grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="premium-card p-7 sm:p-8"
          >
            <h2 className="text-3xl font-bold">Contact Information</h2>
            <p className="mt-4 leading-8 text-verdits-text">
              VERDITS is building a more connected legal ecosystem. We would love to hear from you.
            </p>
            <div className="mt-8 grid gap-4">
              <Info icon={Mail} label="Email" value="verdittss@gmail.com" />
              <Info icon={Phone} label="Phone" value="8688332369" />
              <Info icon={MapPin} label="Location" value="Hyderabad, Telangana, India" />
            </div>
            <div className="mt-8 flex gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-verdits-line bg-white text-verdits-text transition hover:border-verdits-teal hover:bg-verdits-mint hover:text-verdits-navy"
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
      </section>

      <section className="bg-verdits-bg py-20 sm:py-24">
        <div className="section-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-verdits-line bg-white p-6 shadow-xl shadow-black/8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-verdits-teal">Visit us</p>
            <h2 className="mt-3 text-3xl font-bold text-verdits-navy">Our Hyderabad office</h2>
            <p className="mt-4 leading-8 text-verdits-text">
              We are building a premium legal-tech experience for individuals, lawyers, and students across India.
            </p>
            <div className="mt-6 rounded-[1.5rem] border border-verdits-line bg-verdits-section p-5">
              <p className="font-semibold text-verdits-navy">Verdits LLP</p>
              <p className="mt-2 text-sm text-verdits-text">Hyderabad, Telangana, India</p>
              <p className="mt-2 text-sm text-verdits-text">verdittss@gmail.com</p>
              <p className="mt-2 text-sm text-verdits-text">8688332369</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-verdits-line bg-verdits-section p-3 shadow-xl shadow-black/8">
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-verdits-line bg-[radial-gradient(circle_at_top_left,_rgba(247,222,99,0.25),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#fffcf1_100%)] p-6 text-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-verdits-teal">Map placeholder</p>
                <p className="mt-3 text-2xl font-bold text-verdits-navy">Google Maps embed will appear here.</p>
                <p className="mt-3 text-sm leading-7 text-verdits-text">Add your preferred location embed once the office address is finalized.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-verdits-section py-20 sm:py-24">
        <div className="section-shell rounded-[2rem] border border-verdits-line bg-white p-8 text-center shadow-xl shadow-black/8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-verdits-teal">Ready to begin?</p>
          <h2 className="mt-3 text-3xl font-bold text-verdits-navy sm:text-4xl">Book your consultation with trusted legal professionals today.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-verdits-text">
            Whether you need legal support, a consultation, or access to internships and mentorship, Verdits is here for you.
          </p>
          <Link to="/role-selection" className="button-gradient mt-8 inline-flex rounded-full px-7 py-3 text-base font-semibold">
            Book Now
          </Link>
        </div>
      </section>
    </>
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
