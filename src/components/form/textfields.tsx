import React from "react";
import {FieldState} from "formstate";
import {observer} from "mobx-react";
import {Input} from "semantic-ui-react";
import classNames from 'classnames';

interface StyledFormComponent {
    className?: string,
    fluid?: boolean,
}

interface TextFieldProps extends StyledFormComponent {
    label?: string,
    state: FieldState<string>,
    placeholder?: string,
    required?: boolean,
    password?: boolean,
}

export const TextField = observer((props: TextFieldProps) => {
    const {required = false} = props;

    const wrapperClasses = classNames('form-component app_textfield',
        {"w-100": props.fluid},
        props.className,
    );
    return <div className={wrapperClasses}>
        <FieldLabel label={props.label} required={props.required}/>
        <Input
            fluid
            size="mini"
            type={props.password ? 'password' : 'text'}
            value={props.state.value}
            required={required}
            onChange={(e, data) => props.state.onChange(data.value)}
            error={props.state.hasError}
        />
    </div>;
});

const FieldLabel = ({label, required = false}: { label?: string, required?: boolean }) => {
    if (label) {
        return <label className="d-block app_form-label">{label}{required ? '*' : ''}</label>
    }
    return null;
};