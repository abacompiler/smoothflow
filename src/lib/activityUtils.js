import moment from 'moment';

export const toMinutes = (time = '00:00') => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return (h * 60) + m;
};

export const startsOnDate = (activity, dateStr) => {
  if (!activity?.date) return false;

  const actStart = moment(activity.date);
  const day = moment(dateStr);

  if (activity.date === dateStr) return true;
  if (!activity.recurrence || activity.recurrence === 'none') return false;
  if (day.isBefore(actStart)) return false;
  if (activity.recurrence_end_date && day.isAfter(moment(activity.recurrence_end_date))) return false;

  if (activity.recurrence === 'daily') return true;
  if (activity.recurrence === 'weekly') return day.day() === actStart.day();
  if (activity.recurrence === 'monthly') return day.date() === actStart.date();

  return false;
};

export const endsNextDay = (activity) => {
  if (!activity) return false;
  if (activity.end_date && activity.date) {
    return moment(activity.end_date).isAfter(moment(activity.date), 'day');
  }

  return toMinutes(activity.end_time) <= toMinutes(activity.start_time);
};

export const occursOnDate = (activity, dateStr) => {
  if (startsOnDate(activity, dateStr)) return true;
  if (!endsNextDay(activity)) return false;

  const previousDay = moment(dateStr).subtract(1, 'day').format('YYYY-MM-DD');
  return startsOnDate(activity, previousDay);
};

export const getActivityDurationMinutes = (activity) => {
  const start = toMinutes(activity.start_time);
  const end = toMinutes(activity.end_time);

  if (endsNextDay(activity) && end <= start) {
    return (24 * 60 - start) + end;
  }

  return Math.max(0, end - start);
};
