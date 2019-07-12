import React from 'react';
import {Segment} from "semantic-ui-react";
import "./styles.scss";


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