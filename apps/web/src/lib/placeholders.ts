/**
 * PLACEHOLDER CONTENT. Replace with approved values, then set DRAFT_CONTENT to false.
 * Everything here is fake: licence numbers, the founder's quote, contact details.
 * Used by the footer, legal pages, certificate and (later) invoices.
 */
export const DRAFT_CONTENT = true;

export const ACADEMY_LEGAL = {
  crNumber: "1010000000",            // Commercial registration (fake)
  vatNumber: "300000000000003",      // ZATCA VAT number (fake, 15 digits, starts and ends with 3)
  trainingLicence: "TVTC-0000000",   // Training licence (fake)
  city: { ar: "الرياض، المملكة العربية السعودية", en: "Riyadh, Saudi Arabia" },
  email: "academy@example.sa",
  phone: "+966 11 000 0000",
};

/** Bump when the legal text changes; stored with each user's consent. */
export const TERMS_VERSION = "2026-10-draft";

export const FOUNDER = {
  name: { ar: "بدر برشيد", en: "Badr Burshaid" },
  role: { ar: "مؤسس ورئيس المنتدى العالمي لإدارة المشاريع", en: "Founder & Chairman, Global Project Management Forum" },
  photo: "/brand/badr-burshaid.webp",
  signatureImage: null as string | null, // e.g. "/brand/signature-badr.png" once provided
};
