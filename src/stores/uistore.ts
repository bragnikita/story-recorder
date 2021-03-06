import {action, computed, observable, reaction} from "mobx";
import createRouter, {Route, Router, State} from "router5";
import browserPlugin from "router5-plugin-browser";
import {MiddlewareFactory} from "router5/types/types/router";
import {inspect} from "util";
import {Client, ConfigurableInterceptor, HttpRequest} from "../utils/http";
import {config} from "../utils/config";
import {CategoriesStore, CharaListStore, ReaderStore, ScriptsStore, UsersStore} from "./domain_stores";
import {CharactersList} from "../libs/editor_form/models";


class Account {
    username = "__guest__";

    constructor(user: any) {
        this.username = user.username;
    }

    get guest() {
        return this.username === "__guest__"
    }
}

export class UiStore {
    @observable
    private _currentState: State;
    private _router: Router;

    private _http: Client;
    httpInterceptor: ConfigurableInterceptor = new ConfigurableInterceptor();

    account: Account = new Account({username: '__guest__'});


    errorMessage = observable({
        message: "",
        updatedAt: new Date(new Date().getTime() - 1000 * 5),
        deleteAt: 0,
        autoClose: false,
    });

    readonly substores: {
        categories: CategoriesStore,
        users: UsersStore,
        scripts: ScriptsStore,
        reader: ReaderStore,
        chara_lists: CharaListStore,
    };

    PUBLIC_ROUTES = ['script_read', 'category_read', 'not_found', 'login'];

    constructor() {
        const routes: Route[] = [
            {path: '/', name: 'home'},
            {path: '/login', name: 'login'},
            {path: '/categories', name: 'categories'},
            {path: '/category/:id', name: 'category_edit'},
            {path: '/script/:id', name: 'script_edit'},
            {path: '/users', name: 'users', forwardTo: 'users.list'},
            {path: '/list', name: 'users.list'},
            {path: '/:id/edit', name: 'users.edit'},
            {path: '/:id', name: 'users.view'},
            {path: '/create', name: 'users.create'},
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

        const starterPath = window.location.pathname;
        this._router.start(starterPath);

        const http = new HttpRequest();
        http.baseUrl = config.baseUrl;
        http.beforeRequestDefault = config1 => {
            const token = this.getAuthToken();
            if (token) {
                config1.headers['Authorization'] = `Bearer ${token}`;
            }
        };
        http.afterRequestDefault = response => {
            const token = response.headers['x-token'];
            if (token) {
                this.saveAuthToken(token);
            }
        };
        http.interceptor = this.httpInterceptor.handler;
        http.errorHandlerDefault = (error, blocker) => {
            if (error.isServerError() ||
                error.isNetworkError() ||
                error.getStatus() === 404 ||
                error.getStatus() === 403
            ) {
                this.setError(error.getMessage());
                return blocker;
            }
            return true;
        };

        this._http = new Client(http);

        this.substores = {
            categories: new CategoriesStore(this),
            users: new UsersStore(this),
            scripts: new ScriptsStore(this),
            reader: new ReaderStore(this),
            chara_lists: new CharaListStore(this),
        };


        reaction(() => this.errorMessage.updatedAt, (updatedAt) => {
            if (!this.errorMessage.autoClose) return;

            if (this.errorMessage.deleteAt) {
                window.clearTimeout(this.errorMessage.deleteAt);
            }
            this.errorMessage.deleteAt = window.setTimeout(() => {
                if (updatedAt === this.errorMessage.updatedAt) {
                    this.errorMessage.message = "";
                }
            }, 5000)
        });
    }

    @action
    private setState = (nextState: State): Promise<any> => {
        console.log('setState', inspect(nextState));
        if (this.account.guest) {
            if (!this.PUBLIC_ROUTES.includes(nextState.name)) {
                return Promise.reject({redirect: {name: 'login', params: {returnTo: nextState.path}}})
            }
        } else if (["login"].includes(nextState.name)) {
            return Promise.reject({redirect: {name: 'home'}})
        }
        this._currentState = nextState;
        console.log('current_state', this._currentState.name);
        return Promise.resolve(nextState);
    };

    get http() {
        return this._http.req;
    }

    @computed
    get currentState() {
        return this._currentState;
    }

    get router() {
        return this._router;
    }

    /**
     * Update only after 5 sec after the previous error
     */
    @action
    setError = (message?: string, critical?: boolean) => {
        if (critical === true) {
            this.errorMessage.message = message || "";
            this.errorMessage.updatedAt = new Date();
            this.errorMessage.autoClose = false;
        } else {
            if (new Date(this.errorMessage.updatedAt.getTime() + 2 * 1000) < new Date()) {
                this.errorMessage.message = message || "";
                this.errorMessage.updatedAt = new Date();
                this.errorMessage.autoClose = true;
            }
        }
    };

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
        const acc = new Account(data.user);
        this.saveAuthToken(data.token);
        this.signIn(acc);
        return null;
    };

    tryAutoSignIn = async () => {
        const starterPath = this.router.matchPath(window.location.pathname);
        if (this.getAuthToken()) {
            const me = await this.substores.users.fetchMe();
            if (me) {
                this.signIn(new Account(me));
                if (starterPath) {
                    this.router.navigate(starterPath.name, starterPath.params)
                } else {
                    this.router.navigate('categories')
                }
            }
        }
    }


}