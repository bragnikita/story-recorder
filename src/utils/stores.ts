type OnFormData<T> = (form?: T, error?: string) => Promise<string | void>

export interface AsyncFormCallback<T> {
    requestForm: (cb: OnFormData<T>) => void
}

export class AsyncFormCallbackImpl<T> implements AsyncFormCallback<T>{

    requestForm = async (cb: OnFormData<T>) => {
        return cb(undefined, "Not implemented")
    }
}