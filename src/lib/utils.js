import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Junta classes utilitárias e resolve conflitos do Tailwind.
 * Usado pelos componentes shadcn-vue (src/components/ui).
 * @param {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
