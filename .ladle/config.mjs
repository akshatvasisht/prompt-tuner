export default {
  stories: "src/**/*.stories.{js,jsx,ts,tsx}",
  port: 61000,
  host: "127.0.0.1",
  defaultStory: "prompt-tuner-overlay--selection",
  strictMode: false,
  appendToHead: `<meta name="color-scheme" content="light dark">`,
  addons: {
    theme: {
      enabled: true,
      defaultState: "light",
    },
    width: {
      enabled: true,
      options: {
        xsmall: 420,
        small: 620,
        medium: 900,
        large: 1200,
      },
      defaultState: 620,
    },
    a11y: {
      enabled: true,
    },
  },
};
