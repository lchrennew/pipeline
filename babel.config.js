const presets = [
    [
        '@babel/env',
        {
            targets: { node: process.versions.node },
            useBuiltIns: 'usage',
            modules: 'cjs',
            corejs: 3,
        },
    ],
];

const plugins = [
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/plugin-transform-flow-strip-types',
    '@babel/plugin-proposal-dynamic-import',
    '@babel/plugin-syntax-top-level-await',
    '@babel/plugin-proposal-export-default-from',
    'add-module-exports',
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
];

module.exports = {
    presets,
    plugins,
};
