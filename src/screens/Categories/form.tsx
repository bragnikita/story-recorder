import {TextField} from "../../components/form/textfields";
import * as React from "react";
import {useState} from "react";
import {FieldState, FormState} from "formstate";
import {AsyncFormCallback} from "../../utils/stores";

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
}

export const CategoryForm = (
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
                    title: new FieldState(model.title),
                    description: new FieldState(model.description)
                });

                if (callback) {
                    callback.requestForm = async (cb) => {
                        let res = await this.form.validate();
                        if (!res.hasError) {
                            const res: CategoryFormModel = {
                                title: this.form.$.title.$,
                                description: this.form.$.description.$,
                                category_type: 'general',
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


    return <div className="stacked w-100">
        <TextField label="Title" state={store.form.$.title} required/>
    </div>
};