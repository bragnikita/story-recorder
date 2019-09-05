import {UiStore} from "./uistore";
import {Client, HttpRequest} from "../utils/http";
import {OrderMap} from "../utils/stores";
import {Expose} from "class-transformer";
import {jsonToClassSingle, jsonToObjectSingle} from "../utils/serialization";
import {CharactersList} from "../libs/editor_form/models";

export type CategoryChild = Category | Script


export class Category {
    type = "category";
    id: string = "";
    title: string = "";
    category_type: string = "general";
    story_type: string = "";
    parentId: string | undefined = undefined;
    index: number = -1;
    children: CategoryChild[] = [];
    contributors: string[] = [];

    fromJson = (json: any) => {
        this.id = json._id;
        this.title = json.title;
        this.category_type = json.category_type;
        this.story_type = json.story_type;
        this.index = json.index;
        this.parentId = json.parentId;
        this.contributors = json.contributors;
    }
}

export class CategoriesStore {

    root: UiStore;
    private client: HttpRequest;

    constructor(root: UiStore) {
        this.root = root;
        this.client = root.http.req;
    }

    fetchChildCategoriesAndScripts = async (parentId: string) => {
        const {data, error} = await this.root.http.getJson(`/categories/${parentId}/children`);
        const result: CategoryChild[] = [];
        if (!error) {
            const catsJson = data.categories;
            result.push(...catsJson.map((c: any) => {
                const cat = new Category();
                cat.fromJson(c);
                return cat;
            }));

            const scriptsJson = data.scripts;
            result.push(...scriptsJson.map((c: any) => {
                const cat = new Script();
                cat.fromJson(c);
                return cat;
            }));
        } else {
            this.root.setError(error.getMessage());
        }
        return result;
    };

    fetch = async (id: string) => {
        const httpRequest = new HttpRequest(this.client);
        httpRequest.errorHandler = (error1, blocker) => {
            console.log('blocking');
            return blocker
        };
        const {data, error} = await new Client(httpRequest).getJson(`/categories/${id}`);
        if (!error) {
            const cat = new Category();
            cat.fromJson(data.item);
            return cat;
        } else {
            this.root.setError(error.getMessage());
        }
    };

    reorderChildren = async (parent: string, params: {
        categories: OrderMap,
        scripts: OrderMap,
    }) => {
        await new Client(this.client).putJson(`/categories/${parent}`, {
            reorder_categories: params.categories,
            reorder_scripts: params.scripts,
        });
    };

    upsert = async (category: any) => {
        const id = category.id;
        category.id = undefined;
        if (id) {
            await new Client(this.client).putJson(`/categories/${id}`, {
                item: category,
            });
        } else {
            return await new Client(this.client).postJson(`/categories`, {item: category});
        }
    };

    delete = async (id: string) => {
        return new Client(this.client).delete(`/categories/${id}`)
    }
}

export class User {
    @Expose({name: "_id"})
    id: string = "";
    username: string = "";

    asDictItem = () => {
        return {text: this.username, value: this.id}
    }
}

export class UsersStore {
    root: UiStore;
    private client: Client;

    constructor(root: UiStore) {
        this.root = root;
        this.client = new Client(root.http);
    }

    fetchContributors = async () => {
        const {data} = await this.client.getJson('/users/contributors');
        return data.items.map((json: any) => {
            return jsonToClassSingle(User, json);
        })
    };

    fetchAll = async () => {
        const {data} = await this.client.getJson('/users');
        return data.items.map((json: any) => {
            return jsonToClassSingle(User, json);
        })
    };

    fetchMe = async () => {
        const c = this.client.req;
        c.errorHandler = () => false;
        const {data} = await c.getJson('/users/me');
        return data ? jsonToClassSingle(User, data.item) : undefined;
    };

    fetchOne = async (id: string) => {
        const {data} = await this.client.getJson(`/users/find/id/${id}`);
        return jsonToClassSingle(User, data.item);
    };

    fetchByName = async (name: string) => {
        const {data} = await this.client.getJson(`/users/find/username/${name}`);
        return jsonToClassSingle(User, data.item);
    };

    save = async (json: any, id?: string) => {
        if (id) {
            await this.client.putJson(`/users/${id}`, {item: json})
        } else {
            const {data} = await this.client.postJson(`/users`, {item: json})
            return data.id
        }
    }
}

export class ScriptProps {
    title?: string;
    charaListId?: string;
    index: number = -1;
    scriptType: string = 'battle';
    categoryId: string = "";
    content?: { root: any };
}

export type ScriptPropsUpdatable = {
    title?: string,
    charaListId?: string,
    index?: number,
    scriptType?: string,
    categoryId?: string,
    content?: any,
}


export class Script {
    id: string = "";
    props: ScriptProps = new ScriptProps();

    get type() {
        return this.props.scriptType
    }

    get title() {
        return this.props.title
    }

    get index() {
        return this.props.index
    }

    set index(index: number) {
        this.props.index = index;
    }

    fromJson = (json: any) => {
        jsonToObjectSingle(this.props, json);
        this.id = json._id;
    }
}

export class ScriptsStore {
    root: UiStore;
    private client: Client;

    constructor(root: UiStore) {
        this.root = root;
        this.client = new Client(root.http);
    }

    create = async (props: ScriptProps) => {
        const {data} = await this.client.postJson("/scripts", {item: props})
        return data.id
    };
    fetch = async (id: string) => {
        const {data} = await this.client.getJson(`/scripts/${id}`);
        const s = new Script();
        s.fromJson(data.item);
        return s;
    };
    save = async (id: string, props: ScriptPropsUpdatable) => {
        await this.client.putJson(`/scripts/${id}`, {
            item: props
        });
    };

    imageUpload = async (scriptId: string, blockId: string, file: File) => {
        const form = new FormData();
        form.set('file', file);
        const c = this.client.req;
        c.beforeRequest = config => {
            config.headers['Accept'] = 'application/json';
            config.headers['Content-type'] = "";
        };
        const path = `/uploads/${scriptId}/${blockId}`;
        const {data} = await c.request('post', path, form);
        return data.url
    };

    imageDelete = async (scriptId: string, blockId: string) => {
        const path = `/uploads/${scriptId}/${blockId}`;
        await this.client.delete(path)
    };

    fetchCharaList = async (id: string) => {
        //TODO
        return new CharactersList();
    }
}

export type ReadableCategory = {
    root: Category,
    categories: Category[],
    scripts: Script[],
}

export class ReaderStore {
    root: UiStore;
    private client: Client;

    constructor(root: UiStore) {
        this.root = root;
        this.client = new Client(root.http);
    }

    fetch = async (id: string) => {
        const {data} = await this.client.getJson(`/reader/c/${id}`);
        const res = {};

        const root = new Category();
        root.fromJson(data.root);

        const categories = data.categories.map((c: any) => {
            const m = new Category();
            m.fromJson(c);
            return m;
        });

        const scripts = data.scripts.map((s: any) => {
            const m = new Script();
            m.fromJson(s);
            return m;
        });

        return {
            root,
            categories,
            scripts,
        }
    };

    goRel = async (dir: 'next' | 'prev', fromId: string, fallbackId?: string) => {
        const {data} = await this.client.getJson(`/reader/${fromId}/${dir}`);
        const status = data.status;
        if (status === 'ok') {
            this.root.router.navigate('category_read', {id: data.info.id } )
        } else if (fallbackId) {
            this.root.router.navigate('category_read', {id: fallbackId } )
        }
    }

}

export class CharaListStore {
    root: UiStore;
    private client: Client;

    constructor(root: UiStore) {
        this.root = root;
        this.client = new Client(root.http);
    }
    
    fetchOne = async (id: string) => {
        const {data} = await this.client.getJson(`/chara_lists/${id}`);
        return this.deserialize(data.item);
    };

    fetchAll = async (id: string) => {
        const {data} = await this.client.getJson(`/chara_lists/${id}`);
        return data.items.map(this.deserialize);
    };
    
    private deserialize = (json: any) => {
        const list = new CharactersList();
        list.title = json.title;
        list.items = json.items.map((i: any) => {
            return { name: i }
        });
        return list;
    }
}