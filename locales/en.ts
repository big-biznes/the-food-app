/**
 * The app's English text, and the shape every other language file follows.
 * Keys are grouped by screen or feature. `{{name}}` is filled in by the caller;
 * `<icon/>` marks where an inline icon goes (see react-i18next's Trans).
 */
const en = {
  language: {
    name: 'English',
    label: 'Language',
  },
  common: {
    close: 'Close',
    closeHint: 'Drag down or double tap to close',
    next: 'Next',
    gotIt: 'Got it',
    skip: 'Skip',
    and: 'and',
    minutes: '{{count}} min',
    pageOf: 'Page {{page}} of {{total}}',
  },
  days: {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  },
  intro: {
    settingsRow: 'How planning works',
    kicker: 'How your plan works',
    weekTitle: 'Your week, in two shops',
    weekBody: 'Shop on {{shopA}} for {{partA}}, and on {{shopB}} for {{partB}}. Fresh food never waits more than three days.',
    weekBodyEatOut:
      'Shop on {{shopA}} for {{partA}}, and on {{shopB}} for {{partB}}. Fresh food never waits more than three days, and {{outDay}} you eat out.',
    basketTitle: 'One basket, {{count}} meals',
    basketBody:
      '{{items}} come back across your lunches and dinners for these days. You buy one set of ingredients, use it up, and still eat something different every meal.',
    basketBodyNoShared:
      'The lunches and dinners of these days share their ingredients. You buy one set, use it up, and still eat something different every meal.',
    prepKicker: 'Optional',
    prepTitle: 'Prep once, cook faster',
    prepOn: 'on {{day}}',
    prepBody:
      'Chop the vegetables and cook the rice right after shopping, and the next three days of cooking go quicker. Skip it and the meals just take a little longer. Find it on your plan under Prep ahead.',
  },
  tips: {
    close: 'Close tip',
    cart: 'Tap the cart to turn these days into one shopping list.',
    grid: 'See all the meals of these days at once. That is also where you swap meals between days.',
    refresh: 'Not in the mood for a meal? Tap <icon/> on it for a different one.',
    swap: 'Tap <icon/> on a meal, then on another one, and they trade places.',
  },
};

export default en;

/** Every language file has the same keys as English; values are that language's text. */
type Strings<T> = { [K in keyof T]: T[K] extends string ? string : Strings<T[K]> };
export type Translation = Strings<typeof en>;
