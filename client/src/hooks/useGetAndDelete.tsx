import Helpers from "@/helpers/Helpers";
import { useState } from "react";
import { toast } from "sonner";

type ApiMethod = (url: string, config: { headers: any }) => Promise<any>;

const useGetAndDelete = (method: ApiMethod) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<any>(null);

    const callApi = async (path: string, auth: boolean, fileHeaders: boolean) => {
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
            const res = await method(url, { headers });
            const data = res?.data;
            setResponse(data);
            setError(null);
            return data;
        } catch (err: any) {
            toast.error(err.response.data.detail)
            console.error(err)
            setError(err);
            setResponse(null);
            return err;
        } finally {
            setLoading(false);
        }
    };

    return { callApi, loading, response, error };
};

export default useGetAndDelete;