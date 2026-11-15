import { defineConfig } from "wxt";

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    web_accessible_resources: [
      {
        resources: ["gmail-main.js"],
        matches: ["https://mail.google.com/*"],
      },
    ],
  },
});
