/**
 * DonationConfig
 * Centralized configuration for the OnePixel Studio donation system.
 * Modifying DONATION_URL configures the destination everywhere across the application.
 */

/**
 * URL OFICIAL DE DONACIÓN / APOYO A ONEPIXEL STUDIO MEDIANTE PAYPAL
 */
export const DONATION_URL = 'https://paypal.me/DONACIONONEPIXEL';

export interface DonationDestination {
  gateway: 'paypal' | 'kofi' | 'buymeacoffee' | 'stripe' | 'simulated';
  url: string;
  recipientName: string;
  currency: string;
}

export const DONATION_CONFIG: {
  activeDestination: DonationDestination;
  allowRealRedirect: boolean;
  showSupportSection: boolean;
} = {
  activeDestination: {
    gateway: 'paypal',
    url: DONATION_URL,
    recipientName: 'OnePixel Studio',
    currency: 'USD'
  },
  allowRealRedirect: true,
  showSupportSection: true
};
