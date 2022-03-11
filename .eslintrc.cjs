/**
 * @type {import('@types/eslint').Linter.Config}
 */
const config = {
    root: true,
    ignorePatterns: ['dist/**', 'out/**'],
    extends: ['eslint:recommended'],
    rules: {
        'indent': ['warn', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['warn', 'single'],
        'semi': ['warn', 'never'],
    },
    overrides: [],
}

// JSDoc config for JS files
config.overrides.push({
    files: ['*.js'],
    plugins: ['jsdoc'],
    env: {node: true},
    parserOptions: {ecmaVersion: 6},
    extends: ['plugin:jsdoc/recommended'],
    settings: {jsdoc: {mode: 'typescript'}},
    rules: {'valid-jsdoc': 'off'}
});


// Source/scripts
let baseOverride;
config.overrides.push((baseOverride = {
    files: ['src/**/*.ts', 'scripts/**/*.ts'],
    env: {node: true},
    plugins: ['@typescript-eslint'],
    settings: {
        node: {tryExtensions: ['.js', '.ts', '.d.ts']},
    },
    parser: '@typescript-eslint/parser',
    // Type information
    parserOptions: {
        sourceType: 'script',

        // Should be 2021 to match tsconfig.json, but then ts-jest/Babel complains:
        // "TS1343: The 'import.meta' meta-property is only allowed when the '--module' option is" +
        // "'es2020', 'es2022', 'esnext', 'system', 'node12', or 'nodenext'."// )
        ecmaVersion: 2020,

        tsconfigRootDir: __dirname,

        project: [
            './tsconfig.json',
            './scripts/tsconfig.json',
            './src/tsconfig.json',
            './test/tsconfig.json',
        ],
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:node/recommended-module',
    ],
    rules: {
        // '@typescript-eslint/no-unused-vars': 'off',
        // Pretty sure this rule is malfunctioning. Some packages are being reported as "not published",
        // but on cursory glance at the code, I can't figure out why.
        "node/no-unpublished-import": ["error", {
            "allowModules": ["get-stream", "follow-redirects", "unzip-crx-3",
                "graceful-fs", "puppeteer", "tmp", "typescript"]
        }]
    },
}));


// Tests
config.overrides.push({
    ...baseOverride,
    files: ['test/**/*.ts'],
    env: {es6: true, node: true, jest: true, browser: false},
});



// Ignore temporarily since it's taking forever.
// It seems to be importing typescript or something.
config.ignorePatterns = ['test/project/tsconf.tests.ts'];


module.exports = config
