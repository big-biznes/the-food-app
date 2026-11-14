// The Privacy Policy and Terms of Service shown in Settings and at sign-up.
//
// The texts live in constants/legal/<language>.json; `npm run legal` writes the same
// texts as web pages (docs/legal), because the app stores ask for a link to them.
// Change all languages together, and their `updated` date with them.
//
// Before release: fill in LEGAL_OWNER and LEGAL_CONTACT below, and have the texts read
// by someone qualified.

import bg from './legal/bg.json';
import en from './legal/en.json';
import nl from './legal/nl.json';
import config from './legal/config.json';

/** The person or company that publishes the app, as it should appear in the texts (constants/legal/config.json). */
export const LEGAL_OWNER: string = config.owner;
/** Where users can write about their data: an email address. */
export const LEGAL_CONTACT: string = config.contact;

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };

type Source = typeof en;
const SOURCES: Record<string, Source> = { en, bg, nl };

function build(source: Source, doc: 'privacy' | 'terms'): LegalDoc {
  const owner = LEGAL_OWNER || source.ownerFallback;
  const contact = LEGAL_CONTACT ? source.contactWith.replace('{{contact}}', LEGAL_CONTACT) : source.contactWithout;
  const fill = (text: string) => text.replace('{{owner}}', owner).replace('{{contact}}', contact);
  const { title, intro, sections } = source[doc];
  return {
    title,
    updated: source.updated,
    intro: fill(intro),
    sections: sections.map(s => ({ heading: s.heading, body: s.body.map(fill) })),
  };
}

/** The Privacy Policy or the Terms of Service in `language`, in English when there is no translation. */
export function legalDoc(doc: 'privacy' | 'terms', language: string): LegalDoc {
  return build(SOURCES[language] ?? en, doc);
}
