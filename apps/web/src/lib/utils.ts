import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Gabungkan kelas Tailwind tanpa konflik (pola shadcn-vue). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
