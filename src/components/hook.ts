import React, {useContext} from "react";
import {UiStore} from "../stores/uistore";

export const RootStoreContext = React.createContext<UiStore | null>(null);

export const useRootStore = () => {
  const store = useContext(RootStoreContext);
  if (!store) {
      throw "Root store is not set"
  }
  return store;
};