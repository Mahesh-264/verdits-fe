import { useState } from 'react';

const fields = [
  ['Name', 'name', 'text'],
  ['Email', 'email', 'email'],
  ['Phone', 'phone', 'tel'],
  ['Subject', 'subject', 'text'],
];

const initialForm = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);

  const handleSubmit = (event) => {
    event.preventDefault();

    const message = [
      'New contact enquiry from Verdits website',
      '',
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Phone: ${form.phone.trim()}`,
      `Subject: ${form.subject.trim()}`,
      `Message: ${form.message.trim()}`,
    ].join('\n');

    window.open(`https://wa.me/918688332369?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <form className="premium-card p-6 sm:p-8" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([label, name, type]) => (
          <label key={label} className={label === 'Subject' ? 'sm:col-span-2' : ''}>
            <span className="text-sm font-semibold text-verdits-navy">{label}</span>
            <input
              name={name}
              type={type}
              value={form[name]}
              onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
              required
              className="mt-2 w-full rounded-2xl border border-verdits-line bg-white px-4 py-3 text-verdits-navy outline-none transition placeholder:text-stone-400 focus:border-verdits-teal focus:ring-4 focus:ring-verdits-teal/20"
              placeholder={label}
            />
          </label>
        ))}
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold text-verdits-navy">Message</span>
          <textarea
            name="message"
            rows="5"
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            required
            className="mt-2 w-full resize-none rounded-2xl border border-verdits-line bg-white px-4 py-3 text-verdits-navy outline-none transition placeholder:text-stone-400 focus:border-verdits-teal focus:ring-4 focus:ring-verdits-teal/20"
            placeholder="Tell us how VERDITS can help"
          />
        </label>
      </div>
      <button type="submit" className="button-gradient mt-6 w-full rounded-full px-6 py-4 font-semibold">
        Submit Message
      </button>
    </form>
  );
}
