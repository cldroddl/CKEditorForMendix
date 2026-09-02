module.exports = {
    root: true,
    extends: [require.resolve("@mendix/pluggable-widgets-tools/configs/eslint.ts.base.json")],
    env: { es2021: true, browser: true },
    ignorePatterns: ["dist/", "**/__tests__/**"]
};
