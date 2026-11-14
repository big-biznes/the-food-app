// Reminders on the two shopping days of the week, as local notifications:
// nothing is sent to or from a server.
//
// expo-notifications is loaded on first use and every call is guarded, so a
// build made before the package was added keeps working without reminders.

import { Platform } from 'react-native';
import { DAYS, getWeekStructure } from '@/data/meals';
import i18n from '@/lib/i18n';

type Api = typeof import('expo-notifications');

const CHANNEL = 'shopping';
/** Local time of the reminder. */
const HOUR = 10;

let api: Api | null | undefined;

function load(): Api | null {
  if (api !== undefined) return api;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('expo-notifications') as Api;
    // Show the reminder also when the app happens to be open.
    loaded.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    api = loaded;
  } catch {
    api = null;
  }
  return api;
}

/** Ask the system for permission to show notifications. False when refused or unavailable. */
export async function allowReminders(): Promise<boolean> {
  const n = load();
  if (!n || Platform.OS === 'web') return false;
  try {
    if (Platform.OS === 'android') {
      // The channel must exist before Android 13 will show its permission prompt.
      await n.setNotificationChannelAsync(CHANNEL, {
        name: 'Shopping days',
        importance: n.AndroidImportance.DEFAULT,
      });
    }
    const current = await n.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await n.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * Make the scheduled reminders match the plan: one every week on each shopping
 * day of a plan built around `eatingOutDay`, or none when `eatingOutDay` is null
 * (reminders switched off, no plan, signed out). The text is in `language`.
 */
export async function syncReminders(eatingOutDay: string | null, language?: string): Promise<void> {
  const n = load();
  if (!n || Platform.OS === 'web') return;
  try {
    await n.cancelAllScheduledNotificationsAsync();
    if (!eatingOutDay) return;
    if (!(await n.getPermissionsAsync()).granted) return;
    const { partShoppingDay, partLabel } = getWeekStructure(eatingOutDay);
    for (const part of ['A', 'B'] as const) {
      await n.scheduleNotificationAsync({
        content: {
          title: i18n.t('reminder.title', { lng: language }),
          body: i18n.t('reminder.body', { part: partLabel[part], lng: language }),
        },
        trigger: {
          type: n.SchedulableTriggerInputTypes.WEEKLY,
          // Sunday is 1; DAYS starts on Monday.
          weekday: ((DAYS.indexOf(partShoppingDay[part]) + 1) % 7) + 1,
          hour: HOUR,
          minute: 0,
          channelId: CHANNEL,
        },
      });
    }
  } catch (e) {
    console.warn('[reminders] could not schedule:', (e as Error).message);
  }
}
