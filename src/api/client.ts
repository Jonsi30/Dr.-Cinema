const BASE_URL = "https://api.kvikmyndir.is";

const username = process.env.EXPO_PUBLIC_KVIKMYNDIR_USERNAME;
const password = process.env.EXPO_PUBLIC_KVIKMYNDIR_PASSWORD;

type QueryValue = string | number | boolean | null | undefined;
type Query = Record<string, QueryValue>;

let cachedToken: string | null = null;
let cachedExpiry: number | null = null;

const TOKEN_FALLBACK_TTL_MS = 1000 * 60 * 60 * 23; // assume 23h if API omits expiresIn

const ensureCredentials = () => {
	if (!username || !password) {
		throw new Error(
			"Missing kvikmyndir.is credentials. Set EXPO_PUBLIC_KVIKMYNDIR_USERNAME and EXPO_PUBLIC_KVIKMYNDIR_PASSWORD."
		);
	}

	return { username, password };
};

const encodeBase64 = (value: string) => {
	if (typeof globalThis.btoa === "function") {
		return globalThis.btoa(value);
	}

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const BufferImpl = require("buffer").Buffer as typeof Buffer;
	return BufferImpl.from(value, "utf-8").toString("base64");
};

const buildQuery = (query?: Query) => {
	if (!query) return "";

	const searchParams = new URLSearchParams();

	Object.entries(query).forEach(([key, value]) => {
		if (value === undefined || value === null) return;
		searchParams.append(key, String(value));
	});

	const qs = searchParams.toString();
	return qs ? `?${qs}` : "";
};

const buildUrl = (path: string, query?: Query) => {
	const base = path.startsWith("http")
		? path
		: `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

	return `${base}${buildQuery(query)}`;
};

const fetchToken = async () => {
	if (cachedToken && cachedExpiry && cachedExpiry > Date.now()) {
		return cachedToken;
	}

	const { username: user, password: pwd } = ensureCredentials();
	const authHeader = encodeBase64(`${user}:${pwd}`);

	const response = await fetch(buildUrl("/authenticate"), {
		method: "POST",
		headers: {
			Authorization: `Basic ${authHeader}`,
		},
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Authentication failed (${response.status}): ${text || response.statusText}`);
	}

	const body = (await response.json()) as { token?: string; expiresIn?: number | string };

	if (!body.token) {
		throw new Error("Authentication succeeded but no token was returned.");
	}

	const expiresInMs = body.expiresIn ? Number(body.expiresIn) * 1000 : TOKEN_FALLBACK_TTL_MS;

	cachedToken = body.token;
	cachedExpiry = Date.now() + expiresInMs;

	return cachedToken;
};

export type RequestOptions = RequestInit & {
	query?: Query;
	skipAuth?: boolean;
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}) => {
	const { query, skipAuth, headers, ...rest } = options;

	const token = skipAuth ? null : await fetchToken();
	const mergedHeaders: Record<string, string> = {
		Accept: "application/json",
		"Content-Type": "application/json",
		...(headers ? Object.fromEntries(new Headers(headers)) : {}),
	};

	if (token) {
		mergedHeaders["x-access-token"] = token;
	}

	const response = await fetch(buildUrl(path, query), {
		...rest,
		headers: mergedHeaders,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
};

export const apiGet = async <T>(path: string, options?: Omit<RequestOptions, "method">) =>
	apiRequest<T>(path, { ...options, method: "GET" });

export const apiPost = async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
	apiRequest<T>(path, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined });

export const clearCachedToken = () => {
	cachedToken = null;
	cachedExpiry = null;
};
