import React, {useCallback, useContext, useState} from "react";
import {UiStore} from "../stores/uistore";

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
