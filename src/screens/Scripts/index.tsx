import React, {useCallback, useState} from 'react';
import {PageProducer2, useComponentStore, useRootStore} from "../../components/hook";
import {UiStore} from "../../stores/uistore";
import {ControllerContext} from "../../libs/editor_form/hooks"
import {Script} from "../../stores/domain_stores";
import {BlockContainerController, ScriptContoller, ScriptEditorModelConfig} from "../../libs/editor_form/controller";
import {CharactersList, ContainerData} from "../../libs/editor_form/models";
import {BlockContainer} from "../../libs/editor_form/block_container";
import {FieldState, FormState} from "formstate";
import {required} from "../../utils/validators";
import {ScriptTypes} from "../../stores/dictionaries";
import {SyncSelector} from "../../components/form/selectors";
import {TextField} from "../../components/form/textfields";
import {Button, Checkbox} from "semantic-ui-react";
import {PreviewDialog} from "../../libs/editor_form/preview";
import {CharacterEditDialog} from "../../libs/editor_form/chara_list";
import {PrimaryButton} from "../../libs/editor_form/components";
import "./styles.scss";
import {Export} from "./export";
import {action} from "mobx";


class FormStore {
    root: UiStore;
    form: FormState<{
        title: FieldState<string>,
        scriptType: FieldState<string>,
    }>;
    parent: string;

    constructor(root: UiStore, categoryId: string) {
        this.root = root;
        this.parent = categoryId;
        this.form = new FormState({
            title: new FieldState("").validators(required()),
            scriptType: new FieldState(ScriptTypes.default.value),
        })
    }

    create = async () => {
        const {hasError} = await this.form.validate();
        if (!hasError) {
            const f = this.form.$;
            const id = await this.root.substores.scripts.create({
                title: f.title.$,
                index: 0,
                categoryId: this.parent,
                scriptType: f.scriptType.$,
            });
            this.root.router.navigate('script_edit', {id: id})
        }
    }


}

export const ScriptParametersForm = (props: { categoryId: string }) => {
    const rootStore = useRootStore();
    const store = useComponentStore(() => new FormStore(rootStore, props.categoryId));

    return <div className="stacked-1 w-100">
        <TextField state={store.form.$.title} fluid label={"Title"} required/>
        <SyncSelector
            state={store.form.$.scriptType}
            opts={ScriptTypes.items}
            classNames={"w-50"}
        />
        <div className={"flex-hcenter"}>
            <Button primary content="Create" onClick={store.create}/>
        </div>
    </div>
};

export const Producer: PageProducer2<any> = async (root, state, params) => {
    const scriptId = state.params.id;
    const script = await root.substores.scripts.fetch(scriptId);
    let charaList: CharactersList = new CharactersList();
    if (script.props.charaListId) {
        charaList = await root.substores.scripts.fetchCharaList(script.props.charaListId);
    }
    const store = new ScriptEditorStore(root, script, charaList);
    return () => <ScriptEditorPage store={store}/>
};

class ScriptEditorStore {
    private root: UiStore;
    readonly script: Script;
    readonly controller: ScriptContoller;
    title: FieldState<string>;

    constructor(root: UiStore, script: Script, charaList?: CharactersList) {
        this.root = root;
        this.script = script;

        this.title = new FieldState<string>(this.script.title || "");

        const config: ScriptEditorModelConfig = {
            autosaveInterval: -1,
            onImageUpload: async (file: File, blockId: string) => {
                return this.root.substores.scripts.imageUpload(this.script.id, blockId, file)
            },
            onImageDelete: async (blockId: string) => {
                await this.root.substores.scripts.imageDelete(this.script.id, blockId)
            },
            onScriptSave: async (json: any) => {
                await this.root.substores.scripts.save(this.script.id, {
                    content: {
                        root: json,
                    },
                })
            }
        };
        if (!charaList) {
            charaList = new CharactersList();
        }
        const controller = new ScriptContoller(this.script.id, charaList, config);
        if (this.script.props.content) {
            controller.importScript(this.script.props.content);
        }
        this.controller = controller;
    }

    @action delete = async () => {
        await this.root.substores.scripts.deleteScript(this.script.id);
        this.root.router.navigate('category_edit', {id: this.script.props.categoryId})
    };

    @action saveTitle = async () => {
        await this.root.substores.scripts.save(this.script.id, {
            title: this.title.$,
        });
        this.script.props.title = this.title.$;
    };

    getJson = async () => {
        return this.controller.rootContainer.serialize();
    }
}

const ScriptEditorPage = ({store}: { store: ScriptEditorStore }) => {
    const root = useRootStore();
    const onClose = useCallback(() => root.router.navigate('category_edit', {id: store.script.props.categoryId}), []);
    const [editTitle, setEditTitle] = useState(false);
    return <div className="stacked-3">
        <div className="header lined-2 flex-vcenter flex-between">
            <div className={"lined-2 flex-left flex-vcenter w-100"}>
                <Button icon="angle double left"
                        onClick={onClose}
                />
                {!editTitle && <React.Fragment>
                    <span className="title-1 ml-3">{store.script.title}</span>
                    <Button icon={"pencil"} circular onClick={() => setEditTitle(true)}/>
                </React.Fragment>
                }
                {editTitle && <React.Fragment>
                    <TextField state={store.title} placeholder={"Title"} fluid/>
                    <Button icon={"save"} circular onClick={async () => {
                        await store.saveTitle();
                        setEditTitle(false);
                    }}/>
                    <Button icon={"close"} circular onClick={async () => {
                        await store.title.onChange(store.script.title || "");
                        setEditTitle(false);
                    }}/>
                </React.Fragment>
                }

            </div>
            <div>
                <Export getJson={store.getJson}/>
            </div>
        </div>
        <ScriptEditor store={store} onClose={onClose}/>
    </div>
};

const ScriptEditor = (props: { store: ScriptEditorStore, onClose?: () => void }) => {
    const controller = props.store.controller;
    const rootBlock = controller.rootContainer.data as ContainerData;
    const block = new BlockContainerController(controller.rootContainer.id, rootBlock.blocks);
    const [blockDelete, setBlockDelete] = useState(true);
    return <div className="stacked-3 script_editor_base">
        <div className="w-100 flex-between">
            <div className="bm lined-2">
                <PrimaryButton label={"Save"} onClick={controller.exportScript}/>
                <PrimaryButton label={"Save and close"} onClick={async () => {
                    await controller.exportScript();
                    props.onClose && props.onClose();
                }}/>
            </div>
            <div className={"bm lined-2"}>
                <div>
                    <CharacterEditDialog header="Character list editor"
                                         list={controller.list}
                                         onCharaRenamed={controller.renameCharacter}
                    />
                </div>
                <div>
                    <PreviewDialog script={controller.rootContainer}/>
                </div>
            </div>
        </div>
        <div className={"lined-2 flex-right flex-vcenter"}>
            <Checkbox toggle checked={blockDelete} onChange={(event, {checked}) => setBlockDelete(checked || false)}/>
            <Button icon={"trash"} color={"red"} disabled={blockDelete} onClick={props.store.delete}/>
        </div>
        <div className={"bm"}>
            <ControllerContext.Provider value={controller}>
                <BlockContainer block={block}/>
            </ControllerContext.Provider>
        </div>
    </div>
};