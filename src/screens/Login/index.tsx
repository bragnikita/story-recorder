import React, {useState} from 'react';
import {observer} from "mobx-react";
import {Button, Segment} from "semantic-ui-react";
import {TextField} from "../../components/form/textfields";
import {FieldState} from "formstate";
import {action} from "mobx";
import "./styles.scss";
import {useRootStore} from "../../components/hook";


export const Login = observer((props: {}) => {

    const root = useRootStore();
    const [store] = useState(() => {
        class Store {
            login = new FieldState<string>("");
            password = new FieldState<string>("");
            error: string = "";

            @action
            tryLogin = async () => {
                const res = await root.trySignIn(this.login.value, this.password.value);
                if (!res) {
                    root.router.navigate("home")
                } else {
                    this.error = res;
                }
            }
        }

        return new Store();
    });

    return <div className="page__Login">
        <Segment className="stacked-1">
            <TextField state={store.login} label={"Login"} fluid/>
            <TextField state={store.password} label={"Password"} fluid/>
            {store.error && <Segment size="tiny" color="red">{store.error}</Segment>}
            <Button className="" primary
                    onClick={store.tryLogin}
                    disabled={store.login.hasError}>
                Login
            </Button>
        </Segment>
    </div>
});