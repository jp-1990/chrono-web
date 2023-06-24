import {
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear
} from 'date-fns';

export const timeOfDayToPercentage = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const totalSeconds = (hours * 60 + minutes) * 60 + seconds;
  const totalSecondsInDay = 24 * 60 * 60;

  const percentage = (totalSeconds / totalSecondsInDay) * 100;
  return percentage;
};

export const percentageToTimeOfDay = (percentage: number) => {
  const totalSecondsInDay = 24 * 60 * 60;
  const totalSeconds = Math.floor((percentage / 100) * totalSecondsInDay);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
  const seconds = totalSeconds - hours * 3600 - minutes * 60;

  const timeString = `T${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.000`;
  return timeString;
};

export const minutesToHoursAndMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return {
    hours: hours,
    minutes: remainingMinutes
  };
};

export const getDateId = (date: Date) => {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

export const roundSeconds = (date: Date) => {
  const hours = date.getHours();
  if (hours === 23) return date;

  const seconds = date.getSeconds();
  const rounding = seconds >= 30 ? 1 : 0;
  date.setMilliseconds(0);
  date.setSeconds(0);
  date.setTime(date.getTime() + rounding * 60 * 1000);

  return date;
};

export const getDatesInMonthYear = (month, year) => {
  const startDate = startOfMonth(new Date(year, month));
  const endDate = endOfMonth(new Date(year, month));

  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  return dates;
};

export const getAllHoursInDay = () => {
  const startDate = new Date('2000-01-01T00:00:00.000Z');
  const endDate = new Date('2000-01-01T23:59:59.999Z');

  const hours = eachHourOfInterval({ start: startDate, end: endDate });

  return hours;
};

export const getAllMonthsInYear = (year: number) => {
  const startDate = startOfYear(new Date(year, 0));
  const endDate = endOfYear(new Date(year, 11));

  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  return months;
};
