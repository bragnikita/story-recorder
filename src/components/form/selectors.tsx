import React, {useState} from 'react';
import {observer} from "mobx-react";
import {FieldState} from 'formstate';
import {Dropdown, DropdownItemProps, DropdownProps} from "semantic-ui-react";
import classNames from 'classnames';
import {FieldLabel} from "./textfields";
import {inspect} from "util";
import {SelectorOpt} from "../../types";



interface SyncSelectorProps<T> {
    label?: string,
    state: FieldState<T>,
    required?: boolean,
    opts: SelectorOpt<T>[],
    fluid?: boolean,
    classNames?: string,
    getId?: (value: T) => any
}

export const SyncSelector = observer(<T extends any>(props: SyncSelectorProps<T>) => {

    const options: DropdownItemProps[] = props.opts.map((o, index) => ({text: o.label, value: index}));
    const getId = props.getId || ((value) => value);
    const value = props.opts.findIndex((o) => getId(o.value) === getId(props.state.value));
    const classes = classNames('form-component', {"w-100": props.fluid}, props.classNames);
    return <div className={classes}>
        <FieldLabel label={props.label} required={props.required}/>
        <Dropdown
            fluid
            selection
            size={"mini"}
            options={options}
            value={value}
            onChange={(e, {value}) => props.state.onChange(props.opts[value as number].value)}
        />
    </div>
});