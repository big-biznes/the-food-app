import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { syncReminders } from '@/lib/reminders';

/** Keeps the shopping-day reminders in step with the setting and the plan. Renders nothing. */
export default function ShoppingReminders() {
  const { user } = useAuth();
  const { savedPlan } = usePlan();
  const wanted = Boolean(user?.notifications) && savedPlan != null;
  const eatingOutDay = savedPlan?.eatingOutDay ?? null;

  useEffect(() => {
    syncReminders(wanted ? eatingOutDay : null);
  }, [wanted, eatingOutDay]);

  return null;
}
