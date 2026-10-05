// src/pages/Contact.jsx
//
// All shop details come from the shared SITE object in src/lib/site.js, so the
// Contact page and Footer always show the same address, phone and email.

import { useState } from "react";
import { SITE, whatsappLink } from "../lib/site";

// Map pin matches the "Open in Google Maps" link used in the footer.
const MAP_QUERY = "Galaxy Novelty Simdega Jharkhand";
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;

const MailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="m4 6.5 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path
      d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.35-1.14A8.5 8.5 0 1 0 12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M9 9.3c.15-.5.55-.5.9-.5h.4c.2 0 .4.05.5.35.2.5.6 1.5.65 1.6.05.15.1.3 0 .5-.1.2-.15.3-.3.45-.15.15-.3.35-.45.45-.15.15-.3.3-.15.6.15.3.7 1.2 1.55 1.95 1.05.95 1.9 1.25 2.2 1.4.3.15.5.15.65-.05.2-.2.7-.8.9-1.1.2-.3.4-.25.65-.15.3.1 1.7.8 2 .95.3.15.5.2.6.35.1.15.1.85-.2 1.65-.3.8-1.65 1.5-2.3 1.55-.6.1-1.35.15-2.15-.15-.5-.15-1.1-.4-1.9-.75-3.35-1.45-5.5-4.9-5.65-5.15-.15-.25-1.35-1.8-1.35-3.4 0-1.6.85-2.4 1.15-2.7.3-.3.65-.35.85-.35Z"
      fill="currentColor"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path
      d="M5 4h3l1.5 4L7.5 9.5a11 11 0 0 0 6 6l1.5-2L19 15v3a2 2 0 0 1-2 2c-6.6 0-12-5.4-12-12a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const CopyButton = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available -- fail silently, the value is still visible/selectable
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-[11.5px] font-medium text-stone hover:text-moss transition-colors duration-150 shrink-0"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

const SectionCard = ({ icon, title, children }) => (
  <div className="rounded-2xl border border-line bg-card p-5">
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-9 h-9 rounded-full bg-linen flex items-center justify-center text-clay">
        {icon}
      </span>
      <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
    </div>
    {children}
  </div>
);

const Contact = () => {
  const addressLines = SITE.address.map((l) => l.trim()).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
      <div className="mb-8">
        <h1 className="font-display text-[26px] font-semibold text-ink tracking-tight">
          Get in touch
        </h1>
        <p className="text-[13.5px] text-stone mt-1">
          Visit the showroom, call, or message us on WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Left half: map + address */}
        <div className="flex flex-col rounded-2xl border border-line overflow-hidden bg-card">
          <div className="flex-1 min-h-[320px]">
            <iframe
              title="Showroom location"
              src={MAP_EMBED_SRC}
              width="100%"
              height="100%"
              style={{ border: 0, display: "block", minHeight: 320 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="p-5 border-t border-line flex items-start justify-between gap-4">
            <div>
              <h4 className="font-mono text-[10.5px] uppercase tracking-wider text-stone mb-2">
                Showroom address
              </h4>
              <address className="not-italic text-[14px] text-ink leading-relaxed">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
            <a
              href={SITE.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-moss text-paper text-[12.5px] font-medium px-4 py-2 hover:bg-moss-dark transition-colors"
            >
              Open in Maps
            </a>
          </div>
        </div>

        {/* Right half: email, whatsapp, phone */}
        <div className="flex flex-col gap-5">
          <SectionCard icon={<MailIcon />} title="Email">
            <div className="flex items-center justify-between gap-3">
              <a
                href={`mailto:${SITE.email}`}
                className="font-mono text-[14px] text-ink hover:text-moss transition-colors duration-150 break-all"
              >
                {SITE.email}
              </a>
              <CopyButton value={SITE.email} />
            </div>
          </SectionCard>

          <SectionCard icon={<WhatsAppIcon />} title="WhatsApp">
            <div className="flex items-center justify-between gap-3">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[14px] text-ink hover:text-moss transition-colors duration-150"
              >
                {SITE.phone}
              </a>
              <CopyButton value={SITE.phone} />
            </div>
          </SectionCard>

          <SectionCard icon={<PhoneIcon />} title="Call us">
            <div className="flex items-center justify-between gap-3">
              <a
                href={SITE.phoneHref}
                className="font-mono text-[14px] text-ink hover:text-moss transition-colors duration-150"
              >
                {SITE.phone}
              </a>
              <CopyButton value={SITE.phone} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default Contact;