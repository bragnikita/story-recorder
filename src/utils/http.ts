import request, {Response, SuperAgentRequest} from 'superagent';

type RequestParamsMap = { [key: string]: string }
export type RequestProcessingBlocker = () => void;
export type HttpVerb = "get" | "post" | "put" | "delete";
export type ResponseHandler = (response: HttpResponse) => void
export type RequestHandler = (config: RequestConfig) => void
export type RequestIsOk = (status: number) => boolean;
export type RequestErrorHandler = (error: ApiRequestError, blocker: RequestProcessingBlocker) => boolean | RequestProcessingBlocker;
export type HttpRequestInterceptorMethod = (cfg: RequestConfig) => Promise<HttpResponse> | void

export interface RequestConfig {
    verb: HttpVerb,
    uri: string,
    body?: {} | FormData,
    headers: RequestParamsMap,
    cookies: RequestParamsMap,
}

export interface HttpResponse {
    data?: any,
    status: number,
    error?: ApiRequestError,
    headers: RequestParamsMap,
}


export class HttpRequest {

    baseUrl: string = "";

    contentType: string = "application/json";

    isResponseOk: RequestIsOk = ((status1) => status1 < 400 && status1 > 0);

    beforeRequestDefault: RequestHandler = () => {
    };
    beforeRequest?: RequestHandler;
    afterRequestDefault: ResponseHandler = () => {
    };
    errorHandler: RequestErrorHandler = () => true;
    errorHandlerDefault: RequestErrorHandler = () => true;
    interceptor: HttpRequestInterceptorMethod = cfg => {
    };

    constructor(base?: HttpRequest) {
        if (base) {
            this.baseUrl = base.baseUrl;
            this.contentType = base.contentType;
            this.afterRequestDefault = base.afterRequestDefault;
            this.isResponseOk = base.isResponseOk;
            this.beforeRequest = base.beforeRequest;
            this.beforeRequestDefault = base.beforeRequestDefault;
            this.errorHandler = base.errorHandler;
            this.errorHandlerDefault = base.errorHandlerDefault;
            this.interceptor = base.interceptor;
        }
    }


    request = (verb: "get" | "post" | "put" | "delete", uri: string, data?: {} | FormData): Promise<HttpResponse> => {

        let headers: RequestParamsMap = {};
        headers['Cache-Control'] = 'no-cache,no-store';
        headers['Pragma'] = 'no-cache';
        headers['Content-type'] = this.contentType;

        const cookies: RequestParamsMap = {};

        const cfg = {
            uri: uri,
            verb: verb,
            headers: headers,
            cookies: cookies,
            body: data,
        };

        if (this.beforeRequestDefault) {
            this.beforeRequestDefault(cfg)
        }
        if (this.beforeRequest) {
            this.beforeRequest(cfg);
        }
        const intercepted = this.interceptor(cfg);
        if (intercepted) {
            return new Promise<HttpResponse>(resolve => {
                intercepted.then((response) => {
                    if (response.error) {
                        const apiError = response.error;
                        const blocker = () => {
                        };
                        let next = this.errorHandler(apiError, blocker);
                        if (next === blocker) {
                            return;
                        }
                        if (next) {
                            next = this.errorHandlerDefault(apiError, blocker);
                            if (next === blocker) {
                                return;
                            }
                        }
                        resolve(response)
                    } else {
                        resolve(response);
                    }
                });
            });
        }

        const req = this.selectReq(verb);
        const r = req(this.__fullPath(uri));
        r.use((req: SuperAgentRequest) => {
            Object.keys(cfg.headers).forEach((key) => {
                const val = cfg.headers[key];
                if (val) {
                    req.set(key, val);
                } else {
                    req.unset(key)
                }
            })
        }).ok(res => this.isResponseOk(res.status));

        if (data) {
            if (verb === "get" || verb === "delete") {
                r.query(data)
            } else if (data.constructor == FormData) {
                r.unset('content-type');
                r.send(data);
            } else {
                r.send(data);
            }
        }
        return new Promise<HttpResponse>((resolve, reject) => {
            r.then((response: Response) => {

                const res: HttpResponse = {
                    data: response.body,
                    error: undefined,
                    headers: response.header,
                    status: response.status,
                };
                this.afterRequestDefault(res);
                resolve(res);
            }).catch((err: { message: String, response: Response }) => {
                //const apiError = new ApiRequestError(err.response);
                const apiError = new ApiRequestError(undefined);

                let errorBody;
                if (!apiError.isNetworkError()) {
                    const responseType = err.response.type;
                    if (responseType.indexOf('json') > -1) {
                        errorBody = err.response.body;
                    } else {
                        errorBody = err.response.text;
                    }
                }
                const blocker = () => {
                };
                let next = this.errorHandler(apiError, blocker);
                if (next === blocker) {
                    return;
                }
                if (next) {
                    next = this.errorHandlerDefault(apiError, blocker);
                    if (next === blocker) {
                        return;
                    }
                }

                const res: HttpResponse = {
                    data: errorBody,
                    error: apiError,
                    headers: apiError.isNetworkError() ? {} : err.response.header,
                    status: apiError.status,
                };
                resolve(res);
            });
        });
    };

    private selectReq = (verb: HttpVerb) => {
        switch (verb) {
            case "get":
                return request.get;
            case "post":
                return request.post;
            case "put":
                return request.put;
            case "delete":
                return request.delete;
            default:
                return request.post;
        }
    };


    private __fullPath = (path: string) => {
        return `${this.baseUrl}${path}`
    }
}

export class ExtendedHttpRequest extends HttpRequest {
    constructor(base: HttpRequest) {
        super(base);
    }

    getJson = (url: string, query?: {}) => {
        const request = new HttpRequest(this);
        return request.request("get", url, query);
    };
    postJson = (url: string, json: {}) => {
        const request = new HttpRequest(this);
        request.contentType = "application/json";
        return request.request("post", url, json);
    };
    putJson = (url: string, json: {}) => {
        const request = new HttpRequest(this);
        request.contentType = "application/json";
        return request.request("put", url, json);
    };

    get req() {
        return new HttpRequest(this);
    }
}

export class Client {

    base: HttpRequest;

    constructor(base: HttpRequest) {
        this.base = base;
    }

    getJson = (url: string, query?: {}) => {
        return this.req.getJson(url, query);
    };
    postJson = (url: string, json: {}) => {
        return this.req.postJson(url, json);
    };
    putJson = (url: string, json: {}) => {
        return this.req.putJson(url, json);
    };

    delete = (url: string) => {
        return this.req.request('delete', url);
    };

    get req() {
        return new ExtendedHttpRequest(this.base);
    }

}

export class ApiRequestError {
    response?: Response;
    message: string;
    status: number;
    json?: any;

    constructor(responseObject: any) {
        this.response = responseObject;
        if (!responseObject) {
            this.status = 0;
        } else {
            if (responseObject.constructor && responseObject.constructor.name === 'Error') {
                this.response = responseObject.rawResponse;
                this.message = responseObject.rawResponse ? responseObject.rawResponse.toString() : responseObject.toString();
                this.status = responseObject.status;
            } else {
                this.response = responseObject;
                this.status = this.getStatus();
            }
        }
        this.json = this.getBodyJson();
        this.message = this.getMessage();
    }

    getMessage = () => {
        if (this.message) return this.message;
        let text = undefined;
        if (!this.response) {
            return 'Network error'
        }

        if (this.json) {
            text = this.json.message;
        }
        if (text) return text;

        text = this.unquote(this.response.text);
        if (text) return text;

        text = (this.response as any)['statusText'];
        if (text) return text;

        return 'Request failed'
    };

    getBodyJson = () => {
        if (this.json) return this.json;
        if (!this.response) return undefined;
        if (this.response.type && this.response.body) {
            if (this.response.type.includes('json')) {
                return this.response.body;
            } else {
                try {
                    return JSON.parse(this.response.body)
                } catch (e) {
                }
            }
        }
        return undefined;
    };

    getStatus = () => {
        if (this.status !== undefined) return this.status;
        if (!this.response) {
            return 0;
        }
        return this.response.status;
    };

    isNetworkError = () => {
        return this.status === 0;
    };
    isClientError = () => {
        if (!this.response) return false;
        return this.response.clientError;
    };
    isServerError = () => {
        if (!this.response) return false;
        return this.response.serverError;
    };

    toString = () => {
        return this.getMessage();
    };

    private unquote = (str: string) => {
        if (!str) return str;
        const m = str.trim().match(/^"(.*)"$/);
        return m ? m[1] : str;
    }

}

class SimpleInterceptor {
    pattern: RegExp;
    handler: ConfigurableInterceptorMethod;

    constructor(pattern: RegExp, handler: ConfigurableInterceptorMethod) {
        this.pattern = pattern;
        this.handler = handler;
    }
}

interface HttpRequestInterceptor {
    handler: HttpRequestInterceptorMethod;
}

export type ConfigurableInterceptorMethod = (cfg: RequestConfig, match: RegExpMatchArray) => Promise<HttpResponse> | void;

export class ConfigurableInterceptor implements HttpRequestInterceptor {

    handlers: SimpleInterceptor[] = [];

    addHandler = (pattern: RegExp | string, handler: ConfigurableInterceptorMethod) => {
        let p;
        if (typeof pattern === "string") {
            p = new RegExp(`^${escapeRegExp(pattern as string)}`)
        } else {
            p = pattern as RegExp;
        }
        const interceptor = new SimpleInterceptor(p, handler);
        this.handlers.push(interceptor);
        return interceptor;
    };

    reset = () => {
        this.handlers.splice(0, this.handlers.length);
    };

    handler: HttpRequestInterceptorMethod = cfg => {
        const uri = cfg.uri;
        for (const handler of this.handlers) {
            const m = handler.pattern.exec(uri);
            if (m) {
                const res = handler.handler(cfg, m);
                if (res) {
                    return res;
                }
            }
        }
    };
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

