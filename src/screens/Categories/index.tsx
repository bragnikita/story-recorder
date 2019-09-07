import React, {useState} from "react";
import {CategoryObjectsList} from "./list";
import {UiStore} from "../../stores/uistore";
import {Button, Header, Modal} from "semantic-ui-react";
import {CategoryForm, CategoryFormModel} from "./form";
import {action, observable, runInAction} from "mobx";
import {AsyncFormCallbackImpl, OrderMap} from "../../utils/stores";
import {observer} from "mobx-react";
import _ from 'lodash';
import {GlobalErrorMessage} from "../Layout";
import {PageProducer, useRootStore} from "../../components/hook";
import {Category, CategoryChild} from "../../stores/domain_stores";
import {Link} from "react-router5";
import {ScriptParametersForm} from "../Scripts";

class Store {

    rootStore: UiStore;

    @observable category: Category | undefined;

    @observable
    list: CategoryChild[] = [];

    selectedId: string | undefined;
    @observable
    selected: CategoryFormModel | undefined = undefined;

    @observable
    createScriptModalOpened: boolean = false;

    @action
    save = async (form: CategoryFormModel) => {
        if (!this.category) return;
        await this.rootStore.substores.categories.upsert({
            id: this.selectedId,
            parentId: this.category.id,
            ...form,
        });
        this.select();
        await this.reload(this.category ? this.category.id : "root")
    };

    @action
    select = (c?: Category) => {
        if (c) {
            this.selectedId = c.id;
            this.selected = {
                title: c.title,
                description: "",
                category_type: c.category_type,
                story_type: c.story_type,
                index: c.index,
                contributors: c.contributors,
            }
        } else {
            this.selectedId = undefined;
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
            const list = await this.rootStore.substores.categories.fetchChildCategoriesAndScripts(this.category.id);
            runInAction(() => {
                this.list.splice(0, this.list.length);
                this.list.push(...list);
            })
        }
    };

    delete = async () => {
        if (!this.category) return;
        await this.rootStore.substores.categories.delete(this.category.id);
        this.rootStore.router.navigate('category_edit', {id: this.category.parentId})
    };

    requestScript = () => {
        this.createScriptModalOpened = true;
    };

    read = () => {
        if (!this.category) return;
        this.rootStore.router.navigate('category_read', {id: this.category.id})
    }
}

const CategoryPage = observer(({store}: { store: Store }) => {
    const root = useRootStore();
    if (!store.category) return null;

    return <div className="page__CategoryPage">
        <GlobalErrorMessage/>
        <ScriptCreateModal store={store}/>
        <div className="mb-2">
            <Header textAlign={"left"}>
                {store.category.parentId &&
                <Link routeName="category_edit" routeParams={{id: store.category.parentId}}>. . / </Link>}
                {store.category.title}
            </Header>
        </div>
        <div className="flex-between mb-2">
            <div>
                <Button icon={"eye"} basic color={"blue"} onClick={store.read}/>
            </div>
            <div className="lined-1">
                <Button icon={"plus"} content={"Add script"} color="green" onClick={() => {
                    store.requestScript();
                }}/>
                <Button icon={"plus"} content={"Add category"} color="blue" onClick={() => {
                    store.select(store.createNew())
                }}/>
                {store.category && store.category.parentId &&
                <Button icon={"trash"} content={"Delete"} color="red" onClick={() => store.delete()}/>
                }
                <CategoryEditFormModal store={store}/>
            </div>
        </div>
        <CategoryObjectsList
            list={store.list}
            onClickEdit={(id) => {
                let find = store.find(id);
                if (!find) return;
                if (find.type === "category") {
                    store.select(find as Category)
                } else {
                    //TODO
                }
            }}
            onClickView={(id) => {
                let find = store.find(id);
                if (!find) return;
                if (find.type === "category") {
                    root.router.navigate('category_read', {id: id})
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

const ScriptCreateModal = observer(({store}: { store: Store }) => {
    if (!store.category) return null;
    return <Modal
        open={store.createScriptModalOpened}
        onClose={() => store.createScriptModalOpened = false}
    >
        <Header content="New script"/>
        <Modal.Content>
            <ScriptParametersForm categoryId={store.category.id}/>
        </Modal.Content>
    </Modal>
});

export default CategoryPage;