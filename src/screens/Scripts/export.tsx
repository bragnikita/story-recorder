import React, {useEffect, useState} from 'react';
import {Button, Loader, Modal} from "semantic-ui-react";
import TextareaAutosize from "react-textarea-autosize";

export const Export = ({getJson}: { getJson: () => Promise<any> }) => {
    return <Modal trigger={<Button basic>Export</Button>} className={"export_modal"}>
        <Modal.Header>Copy JSON structure from this screen</Modal.Header>
        <Modal.Content>
            <DisplayJson getJson={getJson}/>
        </Modal.Content>
    </Modal>
};

const DisplayJson = ({getJson}: { getJson: () => Promise<any> }) => {
    const [json, setJson] = useState<any>(undefined);
    useEffect(() => {
        getJson().then((json) => {
            setJson(json);
        });
    }, []);
    if (!json) {
        return <Loader active className="w-100 d-flex justify-content-center"/>
    }
    return <div className="">
        <TextareaAutosize className={"export_json"}>
            {JSON.stringify(json, null, 4)}
        </TextareaAutosize>
    </div>
};