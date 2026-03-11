import moment from 'moment';

const WEEKDAY_LABELS = {
  sunday: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
  monday: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
};

export function startOfWeek(date, weekStartsOn = 'monday') {
  return weekStartsOn === 'monday'
    ? moment(date).startOf('isoWeek')
    : moment(date).startOf('week');
}

export function endOfWeek(date, weekStartsOn = 'monday') {
  return weekStartsOn === 'monday'
    ? moment(date).endOf('isoWeek')
    : moment(date).endOf('week');
}

export function getWeekDays(date, weekStartsOn = 'monday', showWeekends = true) {
  const firstDay = startOfWeek(date, weekStartsOn);
  const totalDays = showWeekends ? 7 : 5;

  return Array.from({ length: totalDays }, (_, index) => firstDay.clone().add(index, 'days'));
}

export function getWeekdayLabels(weekStartsOn = 'monday', showWeekends = true) {
  const labels = WEEKDAY_LABELS[weekStartsOn] ?? WEEKDAY_LABELS.monday;
  return showWeekends ? labels : labels.slice(0, 5);
}
