import {UiStore} from "./uistore";
import {Client, HttpRequest} from "../utils/http";
import {OrderMap} from "../utils/stores";

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
    parentId: string | undefined= undefined;
    index: number = -1;
    children: CategoryChild[] = [];

    fromJson = (json: any) => {
        this.id = json._id;
        this.title = json.title;
        this.category_type = json.category_type;
        this.story_type = json.story_type;
        this.index = json.index;
        this.parentId = json.parentId;
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
        const result:CategoryChild[] = [];
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
        console.log(data, error);
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
            await new Client(this.client).putJson(`/categories/${category.id}`, category);
        } else {
            return await new Client(this.client).postJson(`/categories`, category);
        }
    }


}