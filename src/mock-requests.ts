import {ConfigurableInterceptor, HttpResponse} from "./utils/http";
import {inspect} from "util";

export const config = (factory: ConfigurableInterceptor) => {
    factory.addHandler('/auth', cfg => {
        console.log(cfg.uri, inspect(cfg.body));
        const r: HttpResponse = {
            data: {
                token: '1247829y2r8or3roh-token--'
            },
            headers: {},
            status: 200,
        };
        return Promise.resolve(r)
    });
    factory.addHandler(/\/categories\/(.+)/, (cfg, match) => {
        if (cfg.verb !== 'get') return;
        const id = match[1];
        return Promise.resolve({
            data: {
                item: {
                    id: id,
                    title: 'Category title #' + id,
                    children: [
                        {
                            id: `${id}_1`,
                            type: 'category',
                            title: `Child category #${id}_1`
                        },
                        {
                            id: `${id}_2`,
                            type: 'category',
                            title: `Child category #${id}_2`
                        }
                    ]
                }
            },
            headers: {},
            status: 200,
        })
    });
};