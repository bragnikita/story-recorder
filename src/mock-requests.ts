import {ConfigurableInterceptor, HttpResponse} from "./utils/http";
import {inspect} from "util";

export const config = (factory: ConfigurableInterceptor) => {
    // factory.addHandler('/auth', cfg => {
    //     console.log(cfg.uri, inspect(cfg.body));
    //     const r: HttpResponse = {
    //         data: {
    //             token: '1247829y2r8or3roh-token--'
    //         },
    //         headers: {},
    //         status: 200,
    //     };
    //     return Promise.resolve(r)
    // });
    // factory.addHandler(/\/categories\/([^\/]+)$/, (cfg, match) => {
    //     if (cfg.verb !== 'get') return;
    //     const id = match[1];
    //     if (id === "-1") {
    //         const err = new ApiRequestError(new Error('Test message'));
    //         err.status = 400;
    //         return Promise.resolve({
    //             error: err,
    //             headers: {},
    //             status: err.status,
    //         });
    //     }
    //     return Promise.resolve({
    //         data: {
    //             item: {
    //                 id: id,
    //                 title: 'Category title #' + id,
    //                 index: 5,
    //                 category_type: 'story',
    //             }
    //         },
    //         headers: {},
    //         status: 200,
    //     })
    // });
};