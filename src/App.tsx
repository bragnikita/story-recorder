import React, {useEffect, useState} from 'react';
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
import {State} from "router5";
import {UsersManagement} from "./screens/Users";


const PageDisplayer = observer(({store}: { store: UiStore }) => {

    const state = store.currentState;
    const name = state.name;

    return <React.Fragment>
        {name === 'login' && <Login/>}
        {name === 'not_found' && <div>Not found</div>}
        {name === 'home' &&
        <ControlLayout>
            <div>Home</div>
        </ControlLayout>
        }
        {(name === 'categories' || name == 'category_edit') &&
        <ControlLayout>
            <LoadablePage producer={CategoriesPageProducer} state={state}/>
        </ControlLayout>}
        {(name.startsWith('users')) &&
        <ControlLayout>
            <UsersManagement />
        </ControlLayout>
        }
    </React.Fragment>
});

const LoadablePage = ({producer, state}: { producer: PageProducer<UiStore>, state: State }) => {
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
