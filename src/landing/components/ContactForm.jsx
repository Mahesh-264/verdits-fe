const fields = [
  ['Name', 'text'],
  ['Email', 'email'],
  ['Phone', 'tel'],
  ['Subject', 'text'],
];

export default function ContactForm() {
  return (
    <form className="premium-card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([label, type]) => (
          <label key={label} className={label === 'Subject' ? 'sm:col-span-2' : ''}>
            <span className="text-sm font-semibold text-verdits-navy">{label}</span>
            <input
              type={type}
              className="mt-2 w-full rounded-2xl border border-verdits-line bg-white px-4 py-3 text-verdits-navy outline-none transition placeholder:text-stone-400 focus:border-verdits-teal focus:ring-4 focus:ring-verdits-teal/20"
              placeholder={label}
            />
          </label>
        ))}
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold text-verdits-navy">Message</span>
          <textarea
            rows="5"
            className="mt-2 w-full resize-none rounded-2xl border border-verdits-line bg-white px-4 py-3 text-verdits-navy outline-none transition placeholder:text-stone-400 focus:border-verdits-teal focus:ring-4 focus:ring-verdits-teal/20"
            placeholder="Tell us how VERDITS can help"
          />
        </label>
      </div>
      <button type="button" className="button-gradient mt-6 w-full rounded-full px-6 py-4 font-semibold">
        Submit Message
      </button>
    </form>
  );
}
