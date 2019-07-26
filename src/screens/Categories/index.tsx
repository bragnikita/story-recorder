import React, {useEffect, useState} from "react";
import {CategoryObjectsList} from "./list";
import {UiStore} from "../../stores/uistore";
import {Button, Header, Loader, Modal} from "semantic-ui-react";
import {CategoryForm, CategoryFormModel} from "./form";
import {action, observable} from "mobx";
import {AsyncFormCallbackImpl} from "../../utils/stores";
import {observer} from "mobx-react";
import _ from 'lodash';
import {inspect} from "util";
import {GlobalErrorMessage} from "../Layout";
import {PageProducer, useRootStore} from "../../components/hook";
import {Category, CategoryChild, Script} from "../../stores/domain_stores";
import {delay} from "q";

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
        const cat = new Category();
        return cat;
    };

    onReoder = async (order: string[]) => {
        if (!this.category) return;
        await this.rootStore.substores.categories.reorder(
            this.category.id, order
        );
        this.list.forEach((o) => {
            const newIndex = order.indexOf(o.id);
            o.index = newIndex;
        });
        const sorted = _.sortBy(this.list, (o) => o.index)
        this.list.splice(0, this.list.length)
        this.list.push(...sorted);
    };

    find = (id: string) => {
        return this.list.find((v) => v.id === id)
    }

    constructor(rootStore: UiStore) {
        this.rootStore = rootStore;
        const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 11, 12, 13, 14].map((id) => {
            let item: CategoryChild = new Category();
            if (id === 3) {
                item = new Script();
            }
            item.id = `${id}`;
            item.title = id === 3 ? `Script #${id}` : `Category #${id}`
            return item;
        });
        this.list.push(...list);
    }

    reload = async (id: string) => {
        this.category = await this.rootStore.substores.categories.fetch(id);
    }

}

const CategoryPage = observer(({store}: { store: Store }) => {
    if (!store.category) return null;

    return <div className="page__CategoryPage">
        <GlobalErrorMessage/>
        <div className="mb-2">
            <Header textAlign={"left"}>
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
    await localStore.reload(store.currentState.params['id']);
    await delay(1000);
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