import React, {useState} from 'react';
import {useRootStore, useRouter} from "../../components/hook";
import {State} from "router5";
import {LoadablePage, LoadablePage2} from "../../components/pages";
import {UiStore} from "../../stores/uistore";
import {User} from "../../stores/domain_stores";
import {Button, Checkbox, List} from "semantic-ui-react";
import {Link} from "react-router5";
import {TextField} from "../../components/form/textfields";
import {FieldState, FormState} from "formstate";
import {required} from "../../utils/validators";
import './styles.scss';

const ListProducer = async (store: UiStore) => {
    const list = await store.substores.users.fetchAll();
    return () => <Listing {...{list}}  />
};
const Listing = ({list}: { list: User[] }) => {
    const router = useRouter();
    return <div className="page__UserListing">
        <div className="stacked-2 __listing">
        {list.map((user) => {
            return <div key={user.id} className={"flex-between flex-vcenter"}>
                <Link routeName="users.view" routeParams={{id: user.id}}>{user.username}</Link>
                <Button circular icon="pencil"
                        onClick={() => router.navigate('users.edit', {id: user.id})}
                />
            </div>
        })}
        </div>
        <div className="flex-hcenter __buttons">
            <Button basic primary onClick={() => router.navigate('users.create')} icon="plus" content="Add"/>
        </div>
    </div>
};

const SingleProducer = async (store: UiStore, state: State, params: { edit: boolean }) => {
    let user: User;
    const id = state.params.id;
    if (id) {
        user = await store.substores.users.fetchOne(state.params.id);
    } else {
        user = new User();
    }
    const onSave = async (json: any) => {
        const createdId = await store.substores.users.save(json, state.params.id);
        const goToId = id || createdId;
        store.router.navigate('users.view', {id: goToId})
    };
    const onCancel = () => store.router.navigate('users.list');
    return () => <EditPreview edit={params.edit} user={user} onSave={onSave} onCancel={onCancel}/>
};

type UserForm = {
    username: FieldState<string>,
    password: FieldState<string>,
    canLogin: FieldState<boolean>
};

const EditPreview = ({edit, user, onSave, onCancel}: {
    edit?: boolean, user: User,
    onSave: (form: any) => Promise<void>, onCancel: () => void
}) => {
    const [store] = useState(() => {
        class Store {
            form: FormState<UserForm>;

            constructor() {
                this.form = new FormState<UserForm>({
                    username: new FieldState<string>(user.username).validators(required()),
                    password: new FieldState<string>("").validators(required()),
                    canLogin: new FieldState<boolean>(true),
                })
            }

            save = async () => {
                let res = await this.form.validate();
                if (!res.hasError) {
                    await onSave({
                        username: this.form.$.username.$,
                        password: this.form.$.password.$,
                    })
                }
            }

        }

        return new Store();
    });

    return <div className={"w-100 stacked-2 page__UserSingle"}>
        <TextField fluid label={"Username"} state={store.form.$.username} required disabled={!edit}/>
        <TextField fluid label={"Password"} state={store.form.$.password} required disabled={!edit}/>
        <Checkbox toggle label={"Can sign in"} checked={store.form.$.canLogin.$} disabled={!edit}
                  onChange={(event, data) => store.form.$.canLogin.onChange(data.checked || false)}
        />
        <div className={"lined-1 flex-vcenter"}>
            { edit && <Button primary onClick={store.save}>Save</Button> }
            <Button secondary onClick={onCancel}>Return</Button>
        </div>
    </div>
};

const Index = () => {
    const store = useRootStore();
    const page = store.currentState;
    const pageName = page.name;
    if (pageName === 'users.list') {
        return <LoadablePage producer={ListProducer} state={page}/>
    }
    if (pageName === 'users.edit') {
        return <LoadablePage2 producer={SingleProducer} state={page} params={{edit: true}}/>
    }
    if (pageName === 'users.view') {
        return <LoadablePage2 producer={SingleProducer} state={page} params={{edit: false}}/>
    }
    if (pageName === 'users.create') {
        return <LoadablePage2 producer={SingleProducer} state={page} params={{edit: true}}/>
    }
    return null
};

export {
    Index as UsersManagement
}