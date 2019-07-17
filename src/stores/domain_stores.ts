import {UiStore} from "./uistore";
import {Client, HttpRequest} from "../utils/http";

export type CategoryChild = Category | Script

export class Script {
    type = "script";
    id: string = "";
    title: string = "";
    index: number = -1;

    fromJson = (json: any) => {
        this.id = json.id;
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
    index: number = -1;
    children: CategoryChild[] = [];

    fromJson = (json: any) => {
        this.id = json.id;
        this.title = json.title;
        this.category_type = json.category_type;
        this.story_type = json.story_type;
        this.index = json.index;
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
        if (!error) {
            const result = [];
            const catsJson = data.root.categories;
            result.push(...catsJson.map((c: any) => {
                const cat = new Category();
                cat.fromJson(cat);
                return cat;
            }));

            const scriptsJson = data.root.scripts;
            result.push(...scriptsJson.map((c: any) => {
                const cat = new Script();
                cat.fromJson(cat);
                return cat;
            }));
            return result;
        } else {
            this.root.setError(error.getMessage());
        }
    };

    fetch = async (id: string) => {
        const httpRequest = new HttpRequest(this.client);
        httpRequest.errorHandler = (error1, blocker) => {
            console.log('blocking')
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


}