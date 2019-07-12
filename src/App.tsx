import React from 'react';
import './App.css';
import {observer} from "mobx-react";
import {Login} from "./screens/Login";
import {UiStore} from "./stores/uistore";
import {RootStoreContext} from "./components/hook";
import {config} from "./mock-requests";
import {RouterProvider} from "react-router5";
import CategoryPage from "./screens/Categories";
import {ControlLayout} from "./screens/Layout";


const PageDisplayer = observer(({store}: { store: UiStore }) => {

    const state = store.currentState;
    const name = state.name;

    return <React.Fragment>
        {name === 'home' && <div>Home</div>}
        {name === 'login' && <Login/>}
        {name === 'not_found' && <div>Not found</div>}
        {name === 'categories' && <ControlLayout>
            <CategoryPage/>
        </ControlLayout>}
    </React.Fragment>
});

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
