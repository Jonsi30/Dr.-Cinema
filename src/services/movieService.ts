import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { Movie } from "../types/types";

const API_BASE = "https://api.kvikmyndir.is";
const TOKEN_KEY = "@movie_token";
const TOKEN_EXPIRY_KEY = "@movie_token_expiry";

const USERNAME = "richerdman";
const PASSWORD = "=fq.}]nrC6L9eQS"

async function getAuthToken(): Promise<string> {
    try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const expiryString = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);

        if (storedToken && expiryString) {
            const expiry = new Date(expiryString);
            if (expiry > new Date()) {
                return storedToken;
            }
        }

        const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");
        console.log('Testing auth with:', USERNAME);
        console.log('Authorization header:', `Basic ${credentials}`);
        const response = await axios.post(`${API_BASE}/movies`, {}, {
            headers: {
                "Authorization": `Basic ${credentials}`,
                validateStatus: null,
            }
        });
        console.log('Auth success! Token:', response.data.token);
        
        const token = response.data.token;


        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);

        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toISOString());

        return token;
    } catch (error) {
        console.error("Error obtaining auth token:", error);
        throw error;
    }
}

export async function getAllMovies() {
    try {
        const token = await getAuthToken();
        const response = await axios.get(`${API_BASE}/movies`, {
            headers: {
                "x-access-token": token
            }
        });

        // Map API response to your Movie type
        const mappedMovies: Movie[] = response.data.map((apiMovie: any) => ({
            id: parseInt(apiMovie._id || apiMovie.id, 10) || 0,
            title: apiMovie.title,
            plot: apiMovie.plot,
            year: apiMovie.year,
            poster: apiMovie.poster,
            durationMinutes: apiMovie.durationMinutes,
            omdb: apiMovie.omdb?.length > 0 ? {
                imdbRating: apiMovie.ratings?.imdb || "0",
                tomatoRating: `${apiMovie.ratings?.rotten_critics || 0}%`,
                rated: apiMovie.certificateIS || "",
            } : undefined,
            actors: apiMovie.actors_abridged?.map((actor: any) => actor.name || "").filter(a => a) || [],
            directors: apiMovie.directors_abridged?.map((director: any) => director.name || "").filter(d => d) || [],
            genres: apiMovie.genres?.map((genre: any) => genre.name || "").filter(g => g) || [],
            showtimes: apiMovie.showtimes?.flatMap((showtime: any) => {
                return showtime.schedule?.map((sched: any) => {
                    const showtimeObj = {
                        time: sched.time || "",
                        theater: { id: showtime.cinema?.id || 0 }
                    };
                    return showtimeObj;
                }) || [];
            }) || [],
        }));
        return mappedMovies;
    } catch (error) {
        console.error("Error fetching movies:", error);
        throw error;
    }
}

export async function getAllCinemas() {
    try {
        const token = await getAuthToken();
        const response = await axios.get(`${API_BASE}/theaters`, {
            headers: {
                "x-access-token": token
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching cinemas:", error);
        throw error;
    }
}


// Fetch information for a movie by its ID
export async function getMovieDetails(movieId: string) {
    try {
        const token = await getAuthToken();
        const response = await axios.get(`${API_BASE}/movies/${movieId}`, {
            headers: {
                "x-access-token": token
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching movie details for ID ${movieId}:`, error);
        throw error;
    }
}