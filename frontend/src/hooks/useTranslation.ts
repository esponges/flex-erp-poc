import { useIntl } from 'react-intl';
import { useIntlContext } from '@/contexts/IntlContext';

export function useTranslation() {
  const intl = useIntl();
  const { locale, setLocale, isRTL } = useIntlContext();

  // Helper function to format messages with type safety
  const t = (id: string, values?: Record<string, any>) => {
    return intl.formatMessage({ id }, values);
  };

  // Helper for date formatting
  const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return intl.formatDate(dateObj, options);
  };

  // Helper for number formatting
  const formatNumber = (number: number, options?: any) => {
    return intl.formatNumber(number, options);
  };

  // Helper for currency formatting
  const formatCurrency = (amount: number, currency = 'USD') => {
    return intl.formatNumber(amount, {
      style: 'currency',
      currency,
    });
  };

  // Helper for relative time formatting
  const formatRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit) => {
    return intl.formatRelativeTime(value, unit);
  };

  // Helper for pluralization
  const formatPlural = (value: number, options: any) => {
    return intl.formatPlural(value, options);
  };

  return {
    t,
    locale,
    setLocale,
    isRTL,
    formatDate,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
    formatPlural,
    // Expose the full intl object for advanced use cases
    intl,
  };
}