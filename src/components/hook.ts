import React, {useCallback, useContext, useState} from "react";
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

export type PageFactory = () => JSX.Element;

export type PageProducer<T> = (params: T) => Promise<PageFactory>