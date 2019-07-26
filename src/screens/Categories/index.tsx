import React, {useState} from "react";
import {CategoryObjectsList} from "./list";
import {UiStore} from "../../stores/uistore";
import {Button, Header, Modal} from "semantic-ui-react";
import {CategoryForm, CategoryFormModel} from "./form";
import {action, observable} from "mobx";
import {AsyncFormCallbackImpl, OrderMap} from "../../utils/stores";
import {observer} from "mobx-react";
import _ from 'lodash';

import {inspect} from "util";
import {GlobalErrorMessage} from "../Layout";
import {PageProducer} from "../../components/hook";
import {Category, CategoryChild, Script} from "../../stores/domain_stores";
import {delay} from "q";
import {Link} from "react-router5";

class Store {

    rootStore: UiStore;

    @observable category: Category | undefined;

    @observable
    list: CategoryChild[] = [];

    @observable
    selected: CategoryFormModel | undefined = undefined;

    @action
    save = async (form: CategoryFormModel) => {
        console.log(inspect(form));
        await this.rootStore.substores.categories.upsert(form);
        this.select();
    };

    @action
    select = (c?: Category) => {
        if (c) {
            this.selected = {
                title: c.title,
                description: "",
                category_type: c.category_type,
                story_type: c.story_type,
                index: c.index
            }
        } else {
            this.selected = undefined;
        }
    };

    createNew = (): Category => {
        return new Category();
    };

    onReoder = async (cats: OrderMap, scripts: OrderMap) => {
        this.list.forEach((o) => {
            if (o.type === 'category') {
                o.index = cats[o.id]
            } else {
                o.index = scripts.id;
            }
        });
        const sorted = _.sortBy(this.list, (o) => o.index);
        this.list.splice(0, this.list.length);
        this.list.push(...sorted);
        if (!this.category) return;
        await this.rootStore.substores.categories.reorderChildren(this.category.id, {
            categories: cats,
            scripts: scripts,
        });
    };

    find = (id: string) => {
        return this.list.find((v) => v.id === id)
    };

    constructor(rootStore: UiStore) {
        this.rootStore = rootStore;
    }

    reload = async (id: string) => {
        this.category = await this.rootStore.substores.categories.fetch(id || "root");
        if (this.category) {
            this.list = await this.rootStore.substores.categories.fetchChildCategoriesAndScripts(this.category.id);
            console.log(inspect(this.list))
        }
    }

}

const CategoryPage = observer(({store}: { store: Store }) => {
    if (!store.category) return null;

    return <div className="page__CategoryPage">
        <GlobalErrorMessage/>
        <div className="mb-2">
            <Header textAlign={"left"}>
                {store.category.parentId &&
                <Link routeName="category_edit" routeParams={{id: store.category.parentId}}>. . / </Link>}
                {store.category.title}
            </Header>
        </div>
        <div className="lined-1 flex-right mb-2">
            <Button icon={"plus"} content={"Add script"} color="green" onClick={() => {
            }}/>
            <Button icon={"plus"} content={"Add category"} color="blue" onClick={() => {
                store.select(store.createNew())
            }}/>
            <CategoryEditFormModal store={store}/>
        </div>
        <CategoryObjectsList
            list={store.list}
            onClickEdit={(id) => {
                let find = store.find(id);
                if (!find) return
                if (find.type === "category") {
                    store.select(find as Category)
                } else {
                    //TODO
                }
            }}
            onReorder={store.onReoder}
        />
    </div>
});

export const CategoriesPageProducer: PageProducer<UiStore> = async (store) => {
    const localStore = new Store(store);
    await localStore.reload(store.currentState.params['id'] || "root");
    return () => <CategoryPage store={localStore}/>
};

const CategoryEditFormModal = observer(({store}: { store: Store }) => {


    const [asyncHandler] = useState(new AsyncFormCallbackImpl<CategoryFormModel>());

    return <Modal
        open={!!store.selected}
        onClose={() => store.select()}
    >
        <Header content="Edit category"/>
        <Modal.Content>
            {store.selected && <CategoryForm
                callback={asyncHandler}
                model={store.selected}

            />}
        </Modal.Content>
        <Modal.Actions>
            <Button secondary color='red'
                    onClick={() => store.select()}
            >Cancel</Button>
            <Button color='green' primary onClick={() => {
                asyncHandler.requestForm(async (form, error) => {
                    if (form) {
                        store.save(form)
                    }
                });
            }}>Save</Button>
        </Modal.Actions>
    </Modal>
});

export default CategoryPage;