

// export module version
import pkginfo from 'pkginfo';

pkginfo(module, 'version');

const apiDef = {
    name: 'unleash-server',
    version: module.exports.version,
    uri: '/api',
    links: {
    },
};

export default apiDef;
