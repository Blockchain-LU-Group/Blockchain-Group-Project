/**
 * Tailwind CSS Configuration
 * 
 * Tailwind is a utility-first CSS framework that provides low-level utility classes
 * for styling UI components without writing custom CSS.
 */

import type { Config } from 'tailwindcss'

const config: Config = {
  /**
   * content: Files to scan for Tailwind class names
   * Tell Tailwind where to look for utility classes used in the codebase
   * Only classes found in these files will be included in the final CSS
   * 
   * Pattern meanings:
   * - ** = all subdirectories (recursive)
   * - * = any files matching the extension patterns
   * - {js,ts,jsx,tsx,mdx} = file extensions to scan
   */
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',      // All page files in src/pages/
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', // All component files in src/components/
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',        // All files in src/app/ (Next.js App Router)
  ],
  
  /**
   * theme: Customize Tailwind's design system
   * extend: Add custom values while keeping defaults
   * {}: No custom theme extensions in this project
   */
  theme: {
    extend: {},
  },
  
  /**
   * plugins: Additional Tailwind plugins for extended functionality
   * []: No plugins installed (basic Tailwind only)
   */
  plugins: [],
}

export default config