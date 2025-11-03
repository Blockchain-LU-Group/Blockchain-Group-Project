/**
 * PostCSS Configuration
 * 
 * PostCSS is a tool for transforming CSS with JavaScript plugins.
 * It runs during the build process to process CSS files.
 * 
 * This configuration uses two plugins:
 * 1. Tailwind CSS - Processes Tailwind utility classes
 * 2. Autoprefixer - Automatically adds vendor prefixes for browser compatibility
 */

module.exports = {
  plugins: {
    /**
     * Tailwind CSS Plugin
     * Processes @tailwind directives and generates utility classes
     * Must be first in the plugin list to process Tailwind directives
     */
    tailwindcss: {},
    
    /**
     * Autoprefixer Plugin
     * Automatically adds vendor prefixes (e.g., -webkit-, -moz-) to CSS properties
     * Ensures cross-browser compatibility without manual prefixing
     * Examples:
     *   display: flex → display: -webkit-box; display: -ms-flexbox; display: flex;
     *   transform: scale(1.5) → -webkit-transform: scale(1.5); transform: scale(1.5);
     */
    autoprefixer: {},
  },
};