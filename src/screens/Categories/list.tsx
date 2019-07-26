import React, {useEffect, useState} from 'react';
import {Button, Loader, Segment} from "semantic-ui-react";
import {Link} from 'react-router5';
import './styles.scss';
import {action, observable} from "mobx";
import {observer} from "mobx-react";
import {useRootStore} from "../../components/hook";
import classnames from "classnames";
import {CategoryChild} from "../../stores/domain_stores";
import {OrderMap} from "../../utils/stores";


export const CategoryObjectsList = ({
                                        list, categoryId, ...callbacks
                                    }: {
    list?: CategoryChild[]
    categoryId?: string,
    onReorder?: (cats: OrderMap, scripts: OrderMap) => void
    onClickEdit?: (id: string) => void
    onClickView?: (id: string) => void
}) => {
    const store = useRootStore();
    const [children, setChildren] = useState<CategoryChild[] | undefined>(undefined);

    useEffect(() => {
        if (list) {
            setChildren(list);
        } else {

        }
    }, [list, categoryId]);


    if (children) {
        return <Index list={children} {...callbacks} />
    } else {
        return <Segment className="w-100 flex-hcenter">
            <Loader className=""/>
        </Segment>

    }
};

const Index = observer(({list, ...rest}: {
    list: CategoryChild[],
    onClickEdit?: (id: string) => void,
    onClickView?: (id: string) => void,
    onReorder?: (categories: OrderMap, scripts: OrderMap) => void
}) => {

    const [store] = useState(() => {
        class Store {
            @observable
            items: CategoryChild[] = list;

            @observable
            reordering = false;

            @observable
            marked: CategoryChild | undefined = undefined;

            @action
            moveUp = (t: CategoryChild) => {
                this.marked = t;
                const index = this.items.indexOf(t);
                if (index > 0) {
                    this.items.splice(index, 1);
                    this.items.splice(index - 1, 0, t)
                }
            };
            @action
            moveDown = (t: CategoryChild) => {
                this.marked = t;
                const index = this.items.indexOf(t);
                if (index < this.items.length - 1) {
                    this.items.splice(index, 1);
                    this.items.splice(index + 1, 0, t)
                }
            };

            @action reorderStart = () => {
                this.reordering = true;
            };

            @action
            reorderCommit = () => {
                //TODO
                this.marked = undefined;
                this.reordering = false;
                if (rest.onReorder) {
                    const cats: OrderMap = {}, scripts: OrderMap = {};
                    for (let i = 0; i < this.items.length; i++) {
                        const item = this.items[i];
                        if (item.type === 'category') {
                            cats[item.id] = i;
                        } else {
                            scripts[item.id] = i;
                        }
                    }
                    rest.onReorder(cats, scripts);
                }
            };

            @action
            startEditing = (t: CategoryChild) => {
                if (rest.onClickEdit) rest.onClickEdit(t.id)
            };

            @action
            startPreview = (t: CategoryChild) => {
                if (rest.onClickView) rest.onClickView(t.id)
            };

            @action
            addSubCategory = () => {
            };

            @action
            addScript = () => {

            }

        }

        return new Store();
    });


    return <div className="app__category-object-list w-100">
        <div className="__top-panel lined-2 flex-right">
            {!store.reordering && <Button basic onClick={store.reorderStart}>Reorder</Button>}
            {store.reordering && <Button basic color="green" onClick={store.reorderCommit}>Commit</Button>}
        </div>
        { store.items.length == 0 && <Segment color="grey" size="small" className="w-100 text-left">Empty</Segment> }
        <ul>
            {store.items.map((item) => (
                <li key={`${item.type}_${item.id}`}>
                    <div className={classnames("__item category", {
                        'marked': store.marked === item,
                        'hover-marked': !store.marked && store.reordering
                    })}>
                    <span className="__title flex-vcenter">
                        <Link routeName="category_edit" routeParams={{id: item.id}}>{item.title}</Link>
                    </span>
                        {!store.reordering && <div className="__actions lined pl-1">
                            <Button.Group basic size="small">
                                <Button
                                    key={'edit'}
                                    icon='pencil alternate'
                                    onClick={() => store.startEditing(item)}
                                />
                                <Button
                                    key={'view'}
                                    icon='eye'
                                    onClick={() => store.startPreview(item)}
                                />
                            </Button.Group>
                        </div>}
                        {store.reordering && <div className="__actions lined pl-1">
                            <Button.Group basic size="small">
                                <Button
                                    key={'up'}
                                    icon='arrow up'
                                    onClick={() => store.moveUp(item)}
                                />
                                <Button
                                    key={'down'}
                                    icon='arrow down'
                                    onClick={() => store.moveDown(item)}
                                />
                            </Button.Group>
                        </div>}
                    </div>
                </li>
            ))}
        </ul>
    </div>
});