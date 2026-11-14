import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { syncReminders } from '@/lib/reminders';
import { useTranslation } from 'react-i18next';

/** Keeps the shopping-day reminders in step with the setting and the plan. Renders nothing. */
export default function ShoppingReminders() {
  const { user } = useAuth();
  const { savedPlan } = usePlan();
  const wanted = Boolean(user?.notifications) && savedPlan != null;
  const eatingOutDay = savedPlan?.eatingOutDay ?? null;
  // Scheduled notifications keep the text they were made with: redo them when the language changes.
  const { i18n } = useTranslation();
  const language = i18n.language;

  useEffect(() => {
    syncReminders(wanted ? eatingOutDay : null, language);
  }, [wanted, eatingOutDay, language]);

  return null;
}
