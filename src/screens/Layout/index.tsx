import React from 'react';
import {Segment} from "semantic-ui-react";
import "./styles.scss";
import {useRootStore} from "../../components/hook";
import {observer} from "mobx-react";


export const ControlLayout = (props: { children: React.ReactNode }) => {
    return <div className="vh-100 w-100 position-relative layout__ControlLayout">
        <div className="__wrapper">
            <Segment className="__segment w-100">
                {props.children}
            </Segment>
        </div>
    </div>
};

export const NonLoggedInLayout = () => {

};

export const ReaderLayout = () => {

};

export const GlobalErrorMessage = observer(() => {
    const store = useRootStore();
    if (!store.errorMessage.message) {
        return null;
    }
    return <Segment size={"small"} className={"w-100"} secondary color={"red"}>
        {store.errorMessage.message}
    </Segment>
});