export const daysSince = dateString => {
  const date = new Date(dateString);

  if (isNaN(date)) {
    return null;
  }

  const days = (new Date() - date) / (1000 * 60 * 60 * 24);
  return days.toFixed(4);
};
