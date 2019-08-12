import React from 'react';
import {PageProducer2, useRootStore} from "../../components/hook";
import {Category, ReadableCategory, Script} from "../../stores/domain_stores";
import {Link} from "react-router5";
import {Button} from "semantic-ui-react";
import PreviewPanel from "../../libs/editor_form/preview";
import {BlockContainerController} from "../../libs/editor_form/controller";

class ReaderPageModel {

}

const ScriptThread = ({model}: { model: ReadableCategory }) => {
    return <div className="reader_scripts_thread">
        {model.scripts.map((script: Script) => {
            if (!script.props.content) return null;
            const root = script.props.content.root || script.props.content;
            return <div className="__item script_wrapper">
                {script.title &&
                <div className="__title">
                    <hr/>
                    <span className="__content">{script.title}</span>
                    <hr/>
                </div>
                }
                <PreviewPanel script={root}/>
            </div>
        })}
    </div>
};

const CategoriesMenu = ({model}: { model: ReadableCategory }) => {
    return <div className="stacked-3 reader_categories_menu">
        {model.categories.map((c: Category) => {
            return <Link routeName={'category_read'} routeParams={{id: c.id}} key={c.id}>
                <div className="lined-2 __item">
                    <div className="__title">
                        {c.title}
                    </div>
                </div>
            </Link>
        })}
    </div>
};

const Index = ({model}: { model: ReadableCategory }) => {
    const root = useRootStore();
    console.log(root.account);
    return <div className="reader">
        <div className="flex-between category_header">
            <div className="title-1">{model.root.title}</div>
            <div className="line-1">
                {!root.account.guest &&
                <Button circular icon={"pencil"} basic color="green"
                        onClick={() => root.router.navigate('category_edit', {id: model.root.id})}/>
                }
                {model.root.parentId &&
                <Button icon="angle double left"
                        onClick={() => root.router.navigate('category_read', {id: model.root.parentId})}
                />
                }
            </div>
        </div>
        {model.categories.length > 0 &&
        <div className="categories_menu_border">
            <CategoriesMenu model={model}/>
        </div>
        }
        {model.scripts.length > 0 &&
        <div className="script_thread_border">
            <ScriptThread model={model}/>
        </div>
        }
    </div>
};

export const PageProducer: PageProducer2<any> = async (store, state, params) => {
    let id = state.params.id || 'root';
    const val = await store.substores.reader.fetch(id);
    return () => <Index model={val}/>
};
