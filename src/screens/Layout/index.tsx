import React, {useEffect, useRef} from 'react';
import {Menu, Segment} from "semantic-ui-react";
import "./styles.scss";
import {useRootStore} from "../../components/hook";
import {observer} from "mobx-react";
import {transitionPath} from "router5";

const ControlLayoutTopMenu = () => {

    const root = useRootStore();
    const isActive = (...route: string[]) => {
        const state = root.currentState;
        if (!state) return false;
        return route.find((r) => {
            if (r == state.name) return true;
            const stateParts = state.name.split('.');
            return stateParts[0] == r;

        }) != undefined;
    };

    return <Menu className="w-100">
        <Menu.Item header>Story record</Menu.Item>
        <Menu.Item name='home' active={isActive('home')}
                   onClick={() => root.router.navigate('home')}
        />
        <Menu.Item
            name='Categories root'
            active={isActive('categories', 'category_edit')}
            onClick={() => root.router.navigate('categories')}
        />
        <Menu.Item
            name='Users'
            active={isActive('users')}
            onClick={() => root.router.navigate('users.list')}
        />
        <Menu.Item position="right"
                   name='profile'
        />
    </Menu>;
};

export const ControlLayout = (props: { children: React.ReactNode }) => {
    return <div className="vh-100 w-100 position-relative layout__ControlLayout">
        <div className="__wrapper">
            <ControlLayoutTopMenu/>
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