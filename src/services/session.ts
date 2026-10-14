let accessToken: string | undefined;
export const getAccessToken = () => accessToken;
export const setAccessToken = (value: string | undefined) => { accessToken = value; };
