import {UiStore} from "./uistore";
import {Client, HttpRequest} from "../utils/http";
import {OrderMap} from "../utils/stores";
import {Expose} from "class-transformer";
import {jsonToClassSingle} from "../utils/serialization";

export type CategoryChild = Category | Script

export class Script {
    type = "script";
    id: string = "";
    title: string = "";
    index: number = -1;

    fromJson = (json: any) => {
        this.id = json._id;
        this.title = json.title;
        this.index = json.index;
    }
}

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
        if (id) {
            category.id = undefined;
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
