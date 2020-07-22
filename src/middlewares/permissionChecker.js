import MissingPermission from '../permissions/MissingPermission';

import { ADMIN } from '../permissions';


export default (config, permission) => {
    if (!permission || !config.extendedPermissions) {
        return async (ctx, next) => await next();
    }
    return async (ctx, next) => {
        if (ctx.user?.permissions?.indexOf(ADMIN) === -1 && ctx.user?.permissions?.indexOf(permission) === -1) {
            ctx.status = 403
            ctx.body = new MissingPermission({
                permission,
                message: `You require ${permission} to perform this action`,
            })
        } else {
            await next();
        }
    };
}
