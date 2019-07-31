import React, {useCallback, useContext, useEffect, useState} from "react";
import {UiStore} from "../stores/uistore";
import {State} from "router5";

export const RootStoreContext = React.createContext<UiStore | null>(null);

export const useRootStore = () => {
  const store = useContext(RootStoreContext);
  if (!store) {
      throw "Root store is not set"
  }
  return store;
};

export const useRouter = () => {
    const store = useRootStore();
    return store.router;
};

export const useCurrentState = () => {
    const store = useRootStore();
    return store.currentState;
}

export const useModal = () => {
    const [open, setOpen] = useState(false);
    const onClose = useCallback(() => { setOpen(false)},[]);
    const onOpen = useCallback(() => { setOpen(true)},[]);


    return {
        open: open,
        onClose: onClose,
        onOpen: onOpen,
    }
};

export const useWaitForPromise = <T>( p: () => Promise<T>) => {
    const [s, setS] = useState({ loading: true, value: undefined as T | undefined})
    useEffect(() => {
        p().then((v:T) => {
            setS({ loading: false, value: v});
        })
    },[p]);
    return s;
};

export type PageFactory = () => JSX.Element;

export type PageProducer<T> = (params: T) => Promise<PageFactory>
export type PageProducer2<T> = (store: UiStore, state: State, params: T) => Promise<PageFactory>