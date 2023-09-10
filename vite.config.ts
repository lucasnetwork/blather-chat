import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// import devtools from 'solid-devtools/vite';

export default defineConfig({
  plugins: [
    /* 
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    // devtools(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ['crypto'],
      // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
   
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
    solidPlugin(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
