import {action, computed, observable} from "mobx";
import {Route, Router, State} from "router5";
import createRouter from "router5";
import browserPlugin from "router5-plugin-browser";
import {MiddlewareFactory} from "router5/types/types/router";
import {inspect} from "util";
import {Client, ConfigurableInterceptor, HttpRequest, HttpResponse} from "../utils/http";
import {config} from "../utils/config";


class Account {

}

export type CategoryChild = Category | Script

export class Script {
    type = "script";
    id: string = "";
    title: string = "";
    index: number = -1;
}

export class Category {
    type = "category";
    id: string = "";
    title: string = "";
    category_type: string = "general";
    story_type: string = "";
    index: number = -1;
    children: CategoryChild[] = [];
}


export class UiStore {
    @observable
    private _currentState: State;
    private _router: Router;

    private _http: Client;
    httpInterceptor: ConfigurableInterceptor = new ConfigurableInterceptor();

    private account: Account | undefined = undefined;

    constructor() {
        const routes: Route[] = [
            {path: '/', name: 'home'},
            {path: '/login', name: 'login'},
            {path: '/categories', name: 'categories'},
            {path: '/category/:id', name: 'category_edit'},
            {path: '/script/:id', name: 'script_edit'},
            {path: '/r/:id', name: 'script_read'},
            {path: '/c/:id', name: 'category_read'},
            {path: '/not_found', name: 'not_found'}
        ];
        this._router = createRouter(routes, {
            defaultRoute: "not_found",
            queryParamsMode: "loose",
            allowNotFound: false
        });
        this._router.usePlugin(browserPlugin());
        this._currentState = this._router.makeState('home');

        const middlewares: MiddlewareFactory[] = [];
        middlewares.push((router1 => (async (toState, fromState, done) => {
            return this.setState(toState);
        })));
        this._router.useMiddleware(...middlewares);
        this._router.start('/');

        const http = new HttpRequest();
        http.baseUrl = config.baseUrl;
        http.beforeRequestDefault = config1 => {
            const token = this.getAuthToken();
            if (token) {
                config1.headers['x-token'] = token;
            }
        };
        http.afterRequestDefault = response => {
            const token = response.headers['x-token'];
            if (token) {
                this.saveAuthToken(token);
            }
        };
        http.interceptor = this.httpInterceptor.handler;

        this._http = new Client(http);
    }

    @action
    private setState = (nextState: State): Promise<any> => {
        console.log('setState', inspect(nextState));
        if (!this.account) {
            if (!["login", "not_found"].includes(nextState.name)) {
                return Promise.reject({redirect: {name: 'login', params: {returnTo: nextState.path}}})
            }
        } else if (["login"].includes(nextState.name)) {
            return Promise.reject({redirect: {name: 'home'}})
        }
        this._currentState = nextState;
        return Promise.resolve(nextState);
    };

    @computed
    get currentState() {
        return this._currentState;
    }

    get router() {
        return this._router;
    }

    signIn = (account: Account) => {
        this.account = account;
    };

    saveAuthToken = (token: string) => {
        window.localStorage.setItem('token', token);
    };
    getAuthToken = () => {
        return window.localStorage.getItem('token')
    };

    trySignIn = async (username: string, password: string) => {
        const {data, error} = await this._http.req.postJson("/auth", {username, password});
        if (error) {
            return error.getMessage();
        }
        const acc = new Account();
        this.saveAuthToken(data.token);
        this.signIn(acc);
        return null;
    };

    tryAutoSignIn = async () => {
        if (this.getAuthToken()) {
            this.signIn(new Account());
            this.router.navigate('categories')
        }
    }

}