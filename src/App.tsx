import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import {observer} from "mobx-react";
import {Login} from "./screens/Login";
import {UiStore} from "./stores/uistore";
import {PageProducer, RootStoreContext, useRootStore} from "./components/hook";
import {config} from "./mock-requests";
import {RouterProvider} from "react-router5";
import {CategoriesPageProducer} from "./screens/Categories";
import {ControlLayout} from "./screens/Layout";
import {Loader} from "semantic-ui-react";


const PageDisplayer = observer(({store}: { store: UiStore }) => {

    const state = store.currentState;
    const name = state.name;

    return <React.Fragment>
        {name === 'home' && <div>Home</div>}
        {name === 'login' && <Login/>}
        {name === 'not_found' && <div>Not found</div>}
        {(name === 'categories' || name == 'category_edit') &&
        <ControlLayout>
            <LoadablePage factory={CategoriesPageProducer}/>
        </ControlLayout>}
    </React.Fragment>
});

const LoadablePage = ({factory}: { factory: PageProducer<UiStore> }) => {
    const store = useRootStore();
    const [pageFactory, setPageFactory] = useState<JSX.Element>(() => <Loader active
                                                                              className="w-100 d-flex justify-content-center"/>);
    const cancelled = useRef(false);
    useEffect(() => {
        factory(store).then((factory) => {
            if (!cancelled.current) {
                setPageFactory(factory())
            }
        });
        return () => {
            cancelled.current = true
        }
    },[]);
    return pageFactory;
};

const store = new UiStore();

config(store.httpInterceptor);

store.tryAutoSignIn();

const App: React.FC = () => {
    return (
        <div className="app-root">
            <RootStoreContext.Provider value={store}>
                <RouterProvider router={store.router}>
                    <PageDisplayer store={store}/>
                </RouterProvider>
            </RootStoreContext.Provider>
        </div>
    );
};

export default App;
