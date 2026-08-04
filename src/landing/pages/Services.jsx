import { GraduationCap, Scale, UserRound } from 'lucide-react';
import SectionTitle from '../components/SectionTitle.jsx';
import ServiceCard from '../components/ServiceCard.jsx';

const serviceGroups = [
  {
    title: 'For Individuals',
    icon: UserRound,
    items: ['AI Legal Assistant', 'Book a Lawyer', 'Legal Consultation', 'Case Tracking'],
  },
  {
    title: 'For Lawyers',
    icon: Scale,
    items: ['Professional Dashboard', 'Appointment Management', 'Client Management', 'Secure Communication'],
  },
  {
    title: 'For Law Students',
    icon: GraduationCap,
    items: ['Internship Opportunities', 'Mentorship Programs', 'Networking', 'Learning Resources'],
  },
];

export default function Services() {
  return (
    <>
      <section className="bg-dark-radial pt-36 sm:pt-40">
        <div className="section-shell pb-20 pt-10 sm:pb-24">
          <SectionTitle
            align="left"
            eyebrow="Services"
            title="Legal access, professional growth, and student learning in one ecosystem."
            description="Verdits brings together AI assistance, verified legal professionals, and career opportunities for students in a single modern platform."
          />
        </div>
      </section>
      <section className="bg-verdits-section py-20 sm:py-24">
        <div className="section-shell grid gap-6 lg:grid-cols-3">
          {serviceGroups.map((group) => (
            <ServiceCard key={group.title} {...group} />
          ))}
        </div>
      </section>
    </>
  );
}
