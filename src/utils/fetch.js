import fetch from 'node-fetch'

// https://fetch.spec.whatwg.org/#dom-request-method

export const credentials = {
    omit: 'omit',
    include: 'include',
    sameOrigin: 'same-origin',
};

export const mode = {
    cors: 'cors',
    noCors: 'no-cors',
    sameOrigin: 'same-origin',
    navigate: 'navigate',
};

// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods
export const methods = {
    GET: 'GET', // GET方法请求一个指定资源的表示形式. 使用GET的请求应该只被用于获取数据。
    POST: 'POST', // POST方法用于将实体提交到指定的资源，通常导致在服务器上的状态变化或副作用。
    PUT: 'PUT',  // PUT方法用请求有效载荷替换目标资源的所有当前表示。
    DELETE: 'DELETE',    // DELETE方法删除指定的资源。
    HEAD: 'HEAD', // HEAD方法请求一个与GET请求的响应相同的响应，但没有响应体。
    CONNECT: 'CONNECT', // CONNECT方法建立一个到由目标资源标识的服务器的隧道。
    OPTIONS: 'OPTIONS', // OPTIONS方法用于描述目标资源的通信选项。
    TRACE: 'TRACE', // TRACE方法沿着到目标资源的路径执行一个消息环回测试。
    PATCH: 'PATCH', // PATCH方法用于对资源应用部分修改。
};

// https://developer.mozilla.org/zh-CN/docs/Web/API/Request/cache
export const caches = {
    default: 'default',
    noStore: 'no-store', // 浏览器直接从远程服务器获取资源，不查看缓存，并且不会使用下载的资源更新缓存。
    reload: 'reload', // 浏览器直接从远程服务器获取资源，不查看缓存，然后使用下载的资源更新缓存。
    noCache: 'no-cache',
    forceCache: 'force-cache',
    onlyIfCached: 'only-if-cached',
};

export const redirects = {
    follow: 'follow',
    error: 'error',
    manual: 'manual',
};

export const referrers = {
    noReferrer: 'no-referrer',
    client: 'client'
};

export class WebApiContext {

    constructor(webApi: String, endpoint: String) {
        this.url = `${webApi.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`
    }

    header(key, value) {
        if (value === undefined)
            return { ...this.headers }[key];
        this.headers = { ...this.headers, [key]: value };
        return this
    }

    async commit() {
        this.response = await fetch(this.url, this);
        return this.response
    }

    method = methods.GET;
    mode = mode.cors;
    credentials = credentials.include;
    redirect = redirects.follow;
    cache = caches.default;
    referrer = referrers.client;
    body

    async json(body) {
        if (body !== undefined) {
            this.header('Content-Type', 'application/json');
            return this
        }
        return await this.response.json()
    }
}

export const getApi = webApi => async (endpoint, ...args) => {
    const ctx: WebApiContext = new WebApiContext(webApi, endpoint);
    const middlewares = [...args];
    const next = async () => {
        const middleware = middlewares.shift();
        if (middleware) {
            return await middleware(ctx, next)
        } else {
            return ctx.commit()
        }
    };
    return await next()
};

export const method = m => async (ctx: WebApiContext, next) => {
    ctx.method = m;
    return await next()
};

export const GET = method(methods.GET);
export const POST = method(methods.POST);
export const PUT = method(methods.PUT);
export const DELETE = method(methods.DELETE);
export const PATCH = method(methods.PATCH);

export const json = obj => async (ctx: WebApiContext, next) => {
    ctx.header('Content-Type', 'application/json');
    ctx.body = JSON.stringify(obj);
    return await next()
};

export const userToken = token => async (ctx: WebApiContext, next) => {
    ctx.header('user-token', token);
    return await next()
};

export const clientToken = (clientID, token) => async (ctx: WebApiContext, next) => {
    ctx.header('client-id', clientID).header('client-token', token);
    return await next()
};
