/**
 * Next.js Configuration File
 * Controls how Next.js builds and runs the application
 * 
 * Next.js is a React framework that provides:
 * - Server-side rendering (SSR)
 * - Static site generation (SSG)
 * - API routes
 * - File-based routing
 * - Automatic code splitting
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React Strict Mode for better development experience
    // Helps catch bugs and deprecated patterns
    reactStrictMode: true,
    
    // Customize Webpack configuration
    webpack: (config) => {
      /**
       * Fallback configuration - "fallback" = "backup solution"
       * When Webpack cannot find a module in the browser context, what should it do?
       * 
       * Since Next.js runs in the browser, Node.js-specific modules (fs, net, tls)
       * are not available. We need to tell Webpack to ignore them.
       */
      config.resolve.fallback = {
        ...config.resolve.fallback, // Keep existing fallbacks
        fs: false,  // "Can't find fs module? Ignore it!" (filesystem operations)
        net: false, // "Can't find net module? Ignore it!" (networking)
        tls: false, // "Can't find tls module? Ignore it!" (TLS/SSL)
      };
      return config;
    },
};
  
module.exports = nextConfig;