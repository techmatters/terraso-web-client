export const formatDate = (language, dateString) =>
  new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(
    Date.parse(dateString)
  );
