import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Kong Event Gateway Bootcamp',
  description: 'Kong Partner Enablement - Event Gateway: Kafka proxy, ACLs, OAuth, schema validation, encryption, data products, and observability.',

  srcDir: '..',
  outDir: '../dist',
  cacheDir: '../.vitepress-cache',

  base: '/learn-kong-event-gateway/',

  appearance: 'force-dark',
  cleanUrls: true,

  ignoreDeadLinks: true,

  rewrites: {
    'module-01-deploy-connect/README.md': 'module-01-deploy-connect/index.md',
    'module-02-policies-security/README.md': 'module-02-policies-security/index.md',
    'module-03-observability-data-products/README.md': 'module-03-observability-data-products/index.md',
  },

  srcExclude: [
    'node_modules/**',
    'dist/**',
    'docs/.vitepress/**',
    '.vitepress-cache/**',
    'README.md',
    '.github/**',
  ],

  head: [
    ['link', { rel: 'icon',           href: '/learn-kong-event-gateway/favicon.png', type: 'image/png', sizes: '32x32' }],
    ['link', { rel: 'shortcut icon',  href: '/learn-kong-event-gateway/favicon.png', type: 'image/png' }],
    ['link', { rel: 'apple-touch-icon', href: '/learn-kong-event-gateway/favicon.png' }],
    ['meta', { name: 'theme-color', content: '#000F06' }],
    ['meta', { property: 'og:title', content: 'Kong Event Gateway Bootcamp' }],
    ['meta', { property: 'og:description', content: 'Hands-on Kafka proxy: deploy, secure, observe, and package event-driven APIs' }],
    ['meta', { property: 'og:image', content: '/learn-kong-event-gateway/kong-gateway-logo.svg' }],
  ],

  markdown: {
    theme: { light: 'github-light', dark: 'one-dark-pro' },
    lineNumbers: true,
  },

  themeConfig: {
    logo: '/kong-logomark-lime.svg',
    siteTitle: 'Event Gateway Bootcamp',

    nav: [
      { text: '🏠 Home', link: '/' },
      {
        text: '🚀 Getting Started',
        items: [
          { text: '✅ Prerequisites', link: '/prerequisites' },
        ],
      },
      {
        text: '📚 Modules',
        items: [
          { text: '🔌 Module 01: Deploy & Connect',               link: '/module-01-deploy-connect/' },
          { text: '   └─ Lab 01: Gateway Setup',                   link: '/module-01-deploy-connect/labs/01-gateway-setup' },
          { text: '🔐 Module 02: Policies & Security',             link: '/module-02-policies-security/' },
          { text: '   └─ Lab 01: Kafka Policies',                  link: '/module-02-policies-security/labs/01-kafka-policies' },
          { text: '📊 Module 03: Observability & Data Products',   link: '/module-03-observability-data-products/' },
          { text: '   └─ Lab 01: OTel & Namespaces',               link: '/module-03-observability-data-products/labs/01-otel-namespaces' },
        ],
      },
      {
        text: '🔗 Resources',
        items: [
          { text: '📖 Event Gateway Docs', link: 'https://developer.konghq.com/event-gateway/', target: '_blank' },
          { text: '📖 Konnect Docs',       link: 'https://developer.konghq.com/konnect/', target: '_blank' },
          { text: '☁️ Konnect',            link: 'https://cloud.konghq.com', target: '_blank' },
        ],
      },
      { text: '🏠 All Bootcamps', link: 'https://kong-grajesh-se.github.io/learn-kong-bootcamps/', target: '_blank' },
    ],

    sidebar: [
      {
        text: '🚀 Getting Started',
        collapsed: false,
        items: [
          { text: '✅ Prerequisites', link: '/prerequisites' },
        ],
      },
      {
        text: '🔌 Module 01 - Deploy & Connect',
        collapsed: false,
        items: [
          { text: '📋 Overview',                  link: '/module-01-deploy-connect/' },
          { text: '🔌 Lab 01: Gateway Setup',     link: '/module-01-deploy-connect/labs/01-gateway-setup' },
        ],
      },
      {
        text: '🔐 Module 02 - Policies & Security',
        collapsed: false,
        items: [
          { text: '📋 Overview',                  link: '/module-02-policies-security/' },
          { text: '🔐 Lab 01: Kafka Policies',    link: '/module-02-policies-security/labs/01-kafka-policies' },
        ],
      },
      {
        text: '📊 Module 03 - Observability & Data Products',
        collapsed: false,
        items: [
          { text: '📋 Overview',                      link: '/module-03-observability-data-products/' },
          { text: '📊 Lab 01: OTel & Namespaces',     link: '/module-03-observability-data-products/labs/01-otel-namespaces' },
        ],
      },
    ],

    editLink: {
      pattern: 'https://github.com/Kong-Grajesh-SE/learn-kong-event-gateway/edit/main/:path',
      text: 'Edit this page on GitHub',
    },

    lastUpdated: {
      text: 'Updated',
      formatOptions: { dateStyle: 'medium' },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Kong-Grajesh-SE/learn-kong-event-gateway' },
    ],

    footer: {
      message: 'Kong Event Gateway Bootcamp - Partner Enablement',
      copyright: '© Kong Inc. 2026 - The AI Connectivity Company',
    },

    search: { provider: 'local' },
  },
})
