import {TextField} from "../../components/form/textfields";
import * as React from "react";
import {useState} from "react";
import {FieldState, FormState} from "formstate";
import {AsyncFormCallback} from "../../utils/stores";
import {SyncSelector} from "../../components/form/selectors";
import {CategoryTypes, StoryTypes} from "../../stores/dictionaries";
import {observer} from "mobx-react";
import {inspect} from "util";
import {required} from "../../utils/validators";

export type CategoryFormModel = {
    id?: string,
    title: string,
    description: string,
    category_type: string,
    story_type?: string,
    index: number,
}

type FormStruct = {
    title: FieldState<string>,
    description: FieldState<string>,
    categoryType: FieldState<string>,
    storyType: FieldState<string>,
}

export const CategoryForm = observer((
    {model, callback}
        :
        {
            model: CategoryFormModel,
            callback?: AsyncFormCallback<CategoryFormModel>,
        }) => {

    const [store] = useState(() => {
        class Store {
            form: FormState<FormStruct>;

            constructor() {
                this.form = new FormState({
                    title: new FieldState(model.title).validators(required()),
                    description: new FieldState(model.description),
                    categoryType: new FieldState(model.category_type),
                    storyType: new FieldState(model.story_type || "")
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
                            };
                            cb(res)
                        } else {
                            return cb(undefined, this.form.formError || "Form is not valid");
                        }
                    }
                }
            }

        }

        return new Store();
    });


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
    </div>
});