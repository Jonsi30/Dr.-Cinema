import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { Movie, MovieFilters } from '../types/types';

const API_BASE = 'https://api.kvikmyndir.is';
const TOKEN_KEY = '@movie_token';
const TOKEN_EXPIRY_KEY = '@movie_token_expiry';

const USERNAME = 'richerdman';
const PASSWORD = '=fq.}]nrC6L9eQS';

async function getAuthToken(): Promise<string> {
  try {
    const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
    const expiryStr = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (storedToken && expiryStr) {
      const expiry = new Date(expiryStr);
      if (expiry > new Date()) {
        return storedToken;
      }
    }

    const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    
    const response = await axios.post(`${API_BASE}/authenticate`, {}, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    const token = response.data.token;
    
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 23);
    
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toISOString());
    
    return token;
  } catch (error: any) {
    console.error('Error getting auth token:', error.response?.data || error.message);
    throw error;
  }
}

// Build query parameters from filters
function buildQueryParams(filters: MovieFilters): string {
    const params: string[] = [];
    
    console.log('Building query params from filters:', filters);
    
    if (filters.title && filters.title.trim()) {
      params.push(`title=${encodeURIComponent(filters.title)}`);
      console.log('Added title filter:', filters.title);
    }
    
    if (filters.imdbRating?.min) {
      params.push(`imdbrating=${filters.imdbRating.min}`);
      console.log('Added IMDB rating filter:', filters.imdbRating.min);
    }
    
    if (filters.showtimeRange?.start && filters.showtimeRange.start.trim()) {
      params.push(`showtime=${encodeURIComponent(filters.showtimeRange.start)}`);
      console.log('Added showtime filter:', filters.showtimeRange.start);
    }
    
    if (filters.actors && filters.actors.length > 0 && filters.actors[0].trim()) {
      params.push(`actor=${encodeURIComponent(filters.actors[0])}`);
      console.log('Added actor filter:', filters.actors[0]);
    }
    
    if (filters.directors && filters.directors.length > 0 && filters.directors[0].trim()) {
      params.push(`director=${encodeURIComponent(filters.directors[0])}`);
      console.log('Added director filter:', filters.directors[0]);
    }
    
    if (filters.pgRating && filters.pgRating.trim()) {
      params.push(`certificate=${encodeURIComponent(filters.pgRating)}`);
      console.log('Added certificate filter:', filters.pgRating);
    }
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    console.log('Final query string:', queryString);
    return queryString;
  }

// Get all movies with optional filters
export async function getAllMovies(filters?: MovieFilters) {
    try {
        const token = await getAuthToken();
        const queryParams = filters ? buildQueryParams(filters) : '';
        const response = await axios.get(`${API_BASE}/movies${queryParams}`, {
            headers: {
                "x-access-token": token
            }
        });
        const data = Array.isArray(response.data) ? response.data : response.data?.movies || [];
        console.log("Raw data length:", data.length);
        if (data.length === 0) {
            console.log("No movies returned  check filters or API");
        }
        const mappedMovies: Movie[] = data.map((apiMovie: any) => ({
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
            actors: apiMovie.actors_abridged?.map((actor: any) => actor.name || "").filter((a: string) => !!a) || [],
            directors: apiMovie.directors_abridged?.map((director: any) => director.name || "").filter((d: string) => !!d) || [],
            genres: apiMovie.genres?.map((genre: any) => genre.name || "").filter((g: string) => !!g) || [],
            showtimes: apiMovie.showtimes?.flatMap((showtime: any) => {
                return showtime.schedule?.map((sched: any) => ({
                    time: sched.time || "",
                    theater: { id: showtime.cinema?.id || 0 }
                })) || [];
            }) || [],
        }));
        console.log("First mapped movie:", mappedMovies[1]);
        return mappedMovies;
    } catch (error) {
        console.error('Error fetching movies:', error);
        throw error;
    }
}

export async function getAllTheaters() {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE}/theaters`, {
      headers: {
        'x-access-token': token
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching theaters:', error);
    throw error;
  }
}

export async function getMovieById(id: number) {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE}/movies/${id}`, {
      headers: {
        'x-access-token': token
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
}