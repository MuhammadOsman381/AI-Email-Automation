import Helpers from "@/helpers/Helpers";
import { useState } from "react";
import { toast } from "sonner"

type ApiMethod = (url: string, data: any, config: { headers: any }) => Promise<any>;

const usePostAndPut = (method: ApiMethod) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<any>(null);

    const callApi = async (
        path: string,
        data: any,
        auth: boolean,
        fileHeaders: boolean,
        showMessage: boolean
    ) => {
        setLoading(true);
        setError(null);
        const url = `${Helpers.apiUrl}${path}`;
        let headers;

        if (auth) {
            headers = fileHeaders
                ? {
                    "Content-Type": "multipart/form-data",
                    Authorization: `${localStorage.getItem("Authorization")}`,
                }
                : {
                    "Content-Type": "application/json",
                    Authorization: `${localStorage.getItem("Authorization")}`,
                };
        } else {
            headers = fileHeaders
                ? { "Content-Type": "multipart/form-data" }
                : { "Content-Type": "application/json" };
        }

        try {
            const res = await method(url, data, { headers });
            setResponse(res);
            setError(null)
            console.log(res)
            /* eslint-disable @typescript-eslint/no-unused-expressions */
            showMessage && toast.success(res?.data?.message)
            return res
        } catch (err: any) {
            setResponse(null);
            setError(err);
            console.log(err)
            if (Array.isArray(err?.response?.data?.detail)) {
                err.response.data.detail.map((error: { msg: string }) => {
                    toast.error(error.msg)
                })
            } else {
                toast.error(err?.response?.data?.detail)
            }
            return err
        } finally {
            setLoading(false);
        }
    };

    return { callApi, loading, response, error };
};

export default usePostAndPut;