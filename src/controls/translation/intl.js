/**
 * Helper methods for ECMAScript Internationalization API
 * 
 */
const intl = {
  date: (lang, date) => {
    const options = {
      day: 'numeric',
      month: 'long',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric'
    };
    return new Intl.DateTimeFormat([lang, 'en-EN'], options).format(date);
  },
  number: (lang, number) => {
   return new Intl.NumberFormat([lang, 'en-EN']).format(number);
  } 
}
export default intl;
