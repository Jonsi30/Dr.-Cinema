import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "https://api.kvikmyndir.is";
export const TOKEN_KEY = "@kvikmyndir_token";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
        // preserve existing headers and add token; cast to any to satisfy Axios types
        config.headers = {
            ...(config.headers as any || {}),
            "x-access-token": token,
        } as any;
    }
    return config;
});

function toBase64(str: string) {
    try {
        if (typeof Buffer !== "undefined") return Buffer.from(str).toString("base64");
    } catch { }
    try {
        if (typeof btoa !== "undefined") return btoa(str);
    } catch { }
    return Buffer.from(str).toString("base64");
}

export async function authenticate(username: string, password: string) {
    try {
        const params = new URLSearchParams();
        params.append("username", username);
        params.append("password", password);

        const resp = await api.post("/authenticate", params.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        const token = resp?.data?.token;
        if (token) {
            await AsyncStorage.setItem(TOKEN_KEY, token);
            return token;
        }
        throw new Error("No token in response (form-encoded)");
    } catch (err: any) {
        try {
            const basic = toBase64(`${username}:${password}`);
            const raw = axios.create({ baseURL: BASE_URL, timeout: 15000 });
            const resp2 = await raw.post("/authenticate", {}, {
                headers: { Authorization: `Basic ${basic}` },
            });

            const token2 = resp2?.data?.token;
            if (token2) {
                await AsyncStorage.setItem(TOKEN_KEY, token2);
                return token2;
            }
            throw new Error("No token in response (basic)");
        } catch (err2: any) {
            const serverMsg = err?.response?.data || err2?.response?.data || err?.message || err2?.message;
            const status = err?.response?.status || err2?.response?.status || "unknown";
            throw new Error(`Authentication failed (status: ${status}) - ${JSON.stringify(serverMsg)}`);
        }
    }
}

export async function setTokenForTesting(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getTokenFromStorage() {
    return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken() {
    await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function fetchTheaters() {
    try {
        const resp = await api.get("/theaters");
        console.log("fetchTheaters status:", resp.status);
        console.log("fetchTheaters headers:", resp.headers);
        console.log("fetchTheaters data (raw):", resp.data);
        return resp.data;
    } catch (err: any) {
        const server = err?.response?.data ?? err?.message;
        console.error("fetchTheaters error full:", err?.response, err?.message);
        throw new Error(`fetchTheaters failed: ${JSON.stringify(server)}`);
    }
}

export async function fetchTheaterById(id: string) {
    const all = await fetchTheaters();
    const matchId = (candidate: any, idToMatch: string | number | undefined) => {
        if (idToMatch === undefined || idToMatch === null) return false;
        try {
            return String(idToMatch) === String(candidate);
        } catch {
            return false;
        }
    };

    if (Array.isArray(all)) {
        return all.find((t: any) =>
            matchId(t._id, id) || matchId(t.id, id) || matchId(t.mongoid, id)
        ) ?? null;
    }

    if (Array.isArray((all as any).theaters)) {
        return (all as any).theaters.find((t: any) =>
            matchId(t._id, id) || matchId(t.id, id) || matchId(t.mongoid, id)
        ) ?? null;
    }

    return null;
}

export async function fetchMovies(params?: Record<string, string>) {
    try {
        const resp = await api.get("/movies", { params });
        console.log("fetchMovies status:", resp.status);
        console.log("fetchMovies data (raw):", resp.data);

        const d = resp.data;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d.movies)) return d.movies;
        if (Array.isArray(d.results)) return d.results;
        if (Array.isArray(d.data?.movies)) return d.data.movies;

        return d;
    } catch (err: any) {
        console.error("fetchMovies error full:", err?.response || err, err?.message);
        const server = err?.response?.data ?? err?.message;
        throw new Error(`fetchMovies failed: ${JSON.stringify(server)}`);
    }
}

export default api;
