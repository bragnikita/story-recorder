import React, {useEffect, useState} from "react";
import {PageProducer, PageProducer2, useRootStore} from "./hook";
import {UiStore} from "../stores/uistore";
import {State} from "router5";
import {Loader} from "semantic-ui-react";

export const LoadablePage = ({producer, state, ...rest}: { producer: PageProducer<UiStore>, state: State, [key: string]:any }) => {
    const store = useRootStore();
    const loader = <Loader active className="w-100 d-flex justify-content-center"/>;
    const [pageFactory, setPageFactory] = useState<JSX.Element>(() => loader);
    useEffect(() => {
        setPageFactory(loader);
        let cancel = false;
        producer(store).then((factory) => {
            if (!cancel) {
                setPageFactory(factory());
            }
        });
        return () => {
            cancel = true;
        }
    }, [state]);
    return pageFactory;
};

export const LoadablePage2 = <T extends {}>({producer, state, params}: { producer: PageProducer2<T>, state: State, params: T}) => {
    const store = useRootStore();
    const loader = <Loader active className="w-100 d-flex justify-content-center"/>;
    const [pageFactory, setPageFactory] = useState<JSX.Element>(() => loader);
    useEffect(() => {
        setPageFactory(loader);
        let cancel = false;
        producer(store, state, params).then((factory) => {
            if (!cancel) {
                setPageFactory(factory());
            }
        });
        return () => {
            cancel = true;
        }
    }, [state]);
    return pageFactory;
};