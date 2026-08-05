import { Instagram, Linkedin } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';

const quickLinks = [
  ['Home', '/'],
  ['About Us', '/about'],
  ['Services', '/services'],
  ['How We Work', '/#how-we-work'],
  ['Contact Us', '/contact'],
  ['Login', '/role-selection'],
];

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mahesh-babu-bonthala', Icon: Linkedin },
  { label: 'WhatsApp', href: 'https://wa.me/918688332369', Icon: FaWhatsapp },
  { label: 'Instagram', href: 'https://www.instagram.com/_verdits/?hl=en', Icon: Instagram },
];

export default function Footer() {
  return (
    <footer className="border-t border-verdits-line bg-[#fffdf3]">
      <div className="section-shell py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo className="h-14 sm:h-16" />
            <p className="mt-5 max-w-md text-sm leading-7 text-verdits-text">
              Verdits brings legal discovery, consultation, learning, and professional growth into
              one secure digital ecosystem.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-verdits-line bg-white text-verdits-text transition hover:border-verdits-teal hover:bg-verdits-goldSoft hover:text-verdits-navy"
                  aria-label={label}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Quick Links" items={quickLinks} />
          <FooterColumn
            title="Resources"
            items={[
              ['AI Legal Assistant', '/services'],
              ['Lawyer Consultation', '/services'],
              ['Legal Documents', '/services'],
              ['Internships', '/services'],
            ]}
          />
          <FooterColumn
            title="Company"
            items={[
              ['Privacy Policy', '#'],
              ['Terms & Conditions', '#'],
              ['Security', '#'],
              ['Support', '/contact'],
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-verdits-line pt-7 text-sm text-verdits-text sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Verdits LLP. All Rights Reserved.</p>
          <p>Justice, Simplified.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-verdits-navy">{title}</h3>
      <div className="mt-5 grid gap-3">
        {items.map(([label, to]) => (
          <Link key={label} to={to} className="text-sm text-verdits-text transition hover:text-verdits-teal">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
