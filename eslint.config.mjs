import js from '@eslint/js';
import globals from 'globals';

/** Landing sources and build tools; generated bundles in assets/dist are not linted. */
export default [
  { ignores: ['assets/dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['assets/js/main.js', 'assets/js/site.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: globals.browser },
  },
  {
    files: ['assets/js/tour.js', 'assets/js/demo-*.js', 'assets/js/experience.js', 'assets/js/flow-network.js', 'assets/js/connected-scene.js', 'assets/js/flow-scene.js', 'assets/js/module-symbols.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser },
  },
  {
    files: ['tools/**/*.mjs', 'eslint.config.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.node },
  },
];
