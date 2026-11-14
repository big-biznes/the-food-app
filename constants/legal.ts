// The Privacy Policy and Terms of Service shown in Settings.
//
// Before release: fill in LEGAL_OWNER and LEGAL_CONTACT, have the texts read by
// someone qualified, and publish the same texts on a web page (the app stores
// ask for a link). Keep UPDATED in step with any change.

/** The person or company that publishes the app, as it should appear in the texts. */
export const LEGAL_OWNER = 'kebabzter dev'; /** this is only temporary for now */
/** Where users can write about their data, e.g. an email address. */
export const LEGAL_CONTACT = '';

const APP = 'fudapp';
const UPDATED = '13 November 2026';

const owner = LEGAL_OWNER || `the developer of ${APP}`;
const contact = LEGAL_CONTACT
  ? `Write to ${LEGAL_CONTACT}.`
  : `Use the developer contact shown on ${APP}'s page in the app store you downloaded it from.`;

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };

export const PRIVACY: LegalDoc = {
  title: 'Privacy Policy',
  updated: UPDATED,
  intro: `${APP} plans your meals for the week and builds your shopping list. This page says what the app stores about you, why, and how you remove it. ${APP} is published by ${owner}, who is responsible for your data.`,
  sections: [
    {
      heading: 'What we store',
      body: [
        'Your account: your email address and your name. If you sign up with a password, only a scrambled (hashed) form of it is kept. If you sign in with Google, we receive your name, email address and Google account identifier from Google, and nothing else from your Google account.',
        'Your profile: your goal (lose, maintain or gain weight), gender, age, height, weight, activity level, eating preferences and allergies, eating-out day, the country and shops you buy from, and your settings in the app.',
        'What you make in the app: your week plan and the changes you make to it, the meals you liked or disliked, your shopping list and your pantry.',
        'A copy of the above is kept on your phone so the app opens quickly and works without a connection. Shopping reminders are scheduled on your phone and are not sent through a server.',
      ],
    },
    {
      heading: 'What we do not do',
      body: [
        'No advertising and no advertising identifiers. No analytics or tracking of how you use the app. We do not sell or rent your data, and we do not share it with anyone except the service providers named below.',
        'The app does not read your location, contacts, photos, or anything else on your phone.',
      ],
    },
    {
      heading: 'Why we store it',
      body: [
        'To run the app for you: to sign you in, size your portions, choose meals that fit your eating preferences, and keep your plan and lists the same on every device you use. The legal basis is the agreement between you and us to provide the app.',
        'Your weight, height, goal, allergies and diet can say something about your health or beliefs. We use them only for the purposes above, on the basis of your consent, which you give by entering them. You can change them in Settings at any time, and withdraw your consent by deleting your account.',
      ],
    },
    {
      heading: 'Who handles your data for us',
      body: [
        'Supabase provides the sign-in service and the database where your data is stored. Google provides Google sign-in, if you choose to use it. They act on our instructions and may not use your data for their own purposes. Their servers may be in a country other than yours.',
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        'Until you delete your account. Settings → Delete account removes your account, profile, plan, likes, shopping list and pantry from our database straight away, and clears the copy on your phone. Backups made by our hosting provider are overwritten on their normal schedule.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'You can see and correct your data in the app. You can ask us for a copy of your data, ask us to delete it, or object to how we use it. If you live in the European Union you can also complain to your data protection authority, for example the Autoriteit Persoonsgegevens in the Netherlands or the Commission for Personal Data Protection in Bulgaria.',
      ],
    },
    {
      heading: 'Children',
      body: [`${APP} is not meant for anyone under 16, and we do not knowingly keep data about them.`],
    },
    {
      heading: 'Changes and contact',
      body: [
        'When this policy changes, the new text is shown here with a new date. If a change affects how your health or diet data is used, we will ask for your consent again before it applies to you.',
        `Questions or requests about your data: ${contact}`,
      ],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Terms of Service',
  updated: UPDATED,
  intro: `These terms apply when you use ${APP}, published by ${owner}. By creating an account you agree to them.`,
  sections: [
    {
      heading: 'What the app does',
      body: [
        `${APP} suggests meals for your week, sizes the recipes for you, and turns them into a shopping list with indicative prices. You need an account to use it, and you must be at least 16 years old.`,
      ],
    },
    {
      heading: 'Not medical or dietary advice',
      body: [
        'Calorie targets, portion sizes and nutrition values are estimates worked out from general formulas and average ingredient data. They are not advice from a doctor or dietitian. Talk to one before changing your diet if you are pregnant, under 18, have a medical condition or an eating disorder, or take medication that food affects.',
      ],
    },
    {
      heading: 'Allergies and diets',
      body: [
        'Labels such as vegan, gluten-free or nut-free are worked out from each recipe’s ingredient list. Products in shops differ: always read the label of what you buy and check for traces and cross-contamination. If you have a serious allergy, do not rely on the app alone.',
      ],
    },
    {
      heading: 'Prices',
      body: [
        'Shop prices come from public sources and can be out of date or wrong. The price you pay is the one in the shop.',
      ],
    },
    {
      heading: 'Your account',
      body: [
        'Keep your sign-in details to yourself; you are responsible for what happens in your account. Do not misuse the app: no attempts to break it, overload it, or get at other people’s data. We may suspend an account that does.',
        'You can stop at any time by deleting your account in Settings.',
      ],
    },
    {
      heading: 'Content',
      body: [
        'The recipes, texts and design of the app are ours; you may use them for your own cooking, not republish them. What you enter stays yours, and we use it only as the Privacy Policy describes.',
      ],
    },
    {
      heading: 'Availability and liability',
      body: [
        'The app is provided as it is. We work to keep it running and correct, but do not promise that it is always available or free of mistakes, and we may change or stop it.',
        'As far as the law allows, we are not liable for loss or harm that follows from using the app, including from following a recipe or a plan. Nothing in these terms takes away rights you have as a consumer under the law of the country you live in.',
      ],
    },
    {
      heading: 'Changes and contact',
      body: [
        'When these terms change, the new text is shown here with a new date. Using the app after that date means you accept the new terms.',
        `Questions: ${contact}`,
      ],
    },
  ],
};
