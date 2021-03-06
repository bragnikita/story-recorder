import _ from "lodash";
import {observable} from "mobx";
import {Exclude} from "class-transformer";

export type CharaListItem = { name: string }

export const serializeData = (data?: any) => {
    if (!data) {
        return null;
    }
    if (data.serialize) {
        const res = data.serialize;
        if (_.isFunction(res))
            return res();
        else {
            return res;
        }
    }
    return _.toPlainObject(data);
};

export class ScriptBlock {
    id: string;
    @observable
    type: string;
    @observable
    data?: any;

    @observable
    meta: BlockMeta;

    constructor(id: string, type: string) {
        this.id = id;
        this.type = type;
        this.meta = new BlockMeta();
    }

    serialize = () => {
        return {
            id: this.id,
            type: this.type,
            data: serializeData(this.data)
        }
    }
}

export class BlockMeta {
    @observable
    request?: string = "";
    @observable
    active = false;
    @observable
    hovered = false;
}

export class SerifData {
    character_name?: string;
    text: string = "";
    // curtain or general (or "")
    type: string = "";
    @Exclude()
    meta: {
        request?: string
    } = {};

    serialize = () => {
        return {
            character_name: this.character_name,
            text: this.text,
        }
    }
}

export class SimpleTextData {
    @observable
    text: string = "";
    @Exclude()
    meta: {
        request?: string
    } = {}
}

export class ImageData {
    @observable
    path: string = "";
}

export class ContainerData {
    @observable
    title: string = "";
    @observable
    blocks: ScriptBlock[] = [];
}

export interface HotkeyHandle {
    next(): void
}

export class CharactersList {
    @observable
    title: string = "";
    items: CharaListItem[] = observable([], {deep: true});
    @observable
    stale: boolean = false;
}