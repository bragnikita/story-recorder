export const required = (msg: string = "Required item") => (value:any) => {
    let valid = true;
    if (!value) valid = false;
    if (typeof value === "string" && value.trim().length === 0) valid = false;
    return !valid && msg;
};