class Config {
    readonly baseUrl = `${process.env.REACT_APP_API_URI}`;
}

export const config = new Config();