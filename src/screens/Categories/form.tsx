import {TextField} from "../../components/form/textfields";
import React, { useState} from "react";
import {FieldState, FormState} from "formstate";
import {AsyncFormCallback} from "../../utils/stores";
import {MultipleSelector, SyncSelector} from "../../components/form/selectors";
import {CategoryTypes, StoryTypes} from "../../stores/dictionaries";
import {observer} from "mobx-react";
import {delay} from 'q';
import {inspect} from "util";
import {required} from "../../utils/validators";
import {Dropdown, DropdownItemProps, DropdownProps} from "semantic-ui-react";
import {useRootStore, useWaitForPromise} from "../../components/hook";
import {User} from "../../stores/domain_stores";

export type CategoryFormModel = {
    id?: string,
    title: string,
    description: string,
    category_type: string,
    story_type?: string,
    index: number,
    contributors: string[],
}

type FormStruct = {
    title: FieldState<string>,
    description: FieldState<string>,
    categoryType: FieldState<string>,
    storyType: FieldState<string>,
    contributors: FieldState<string[]>,
}

export const CategoryForm = observer((
    {model, callback}
        :
        {
            model: CategoryFormModel,
            callback?: AsyncFormCallback<CategoryFormModel>,
        }) => {
    const root = useRootStore();

    const [store] = useState(() => {
        class Store {
            form: FormState<FormStruct>;

            constructor() {
                this.form = new FormState({
                    title: new FieldState(model.title).validators(required()),
                    description: new FieldState(model.description),
                    categoryType: new FieldState(model.category_type),
                    storyType: new FieldState(model.story_type || ""),
                    contributors: new FieldState(model.contributors || [])
                });

                if (callback) {
                    callback.requestForm = async (cb) => {
                        let res = await this.form.validate();
                        if (!res.hasError) {
                            const res: CategoryFormModel = {
                                title: this.form.$.title.$,
                                description: this.form.$.description.$,
                                category_type: this.form.$.categoryType.$,
                                story_type: this.form.$.storyType.$,
                                index: model.index,
                                contributors: this.form.$.contributors.$,
                            };
                            cb(res)
                        } else {
                            return cb(undefined, this.form.formError || "Form is not valid");
                        }
                    }
                }
            }

            getContributors = async () => {
                const contributors = await root.substores.users.fetchContributors();
                return contributors.map((c: User) => {
                    return { text: c.username, value: c.username }
                })
            }
        }

        return new Store();
    });

    const {value, loading} = useWaitForPromise(store.getContributors);

    return <div className="stacked-1 w-100">
        <TextField label="Title" state={store.form.$.title} required/>
        <div className="lined-1">
            <SyncSelector
                state={store.form.$.categoryType}
                opts={CategoryTypes.items}
                classNames={"w-50"}
            />
            {store.form.$.categoryType.$ === "story" &&
            <SyncSelector
                state={store.form.$.storyType}
                opts={StoryTypes.items}
                classNames={"w-50"}
            />
            }
        </div>
        <MultipleSelector
            placeholder='Contributors'
            opts={value || []}
            loading={loading}
            state={store.form.$.contributors}
        />
    </div>
});