const TIME_ONE_DAY = 86400000;

export const daysSince = dateString => {
  const date = new Date(dateString);

  if (isNaN(date)) {
    return null;
  }

  const days = (new Date() - date) / TIME_ONE_DAY;
  return days.toFixed(4);
};
