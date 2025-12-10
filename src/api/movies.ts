import { Movie, ShowTime, UpcomingMovie } from "../types/types";
import { apiGet } from "./client";

export interface MovieFilters {
  title?: string;
  imdbMin?: number;
  rottenTomatoesMin?: number;
  startsAfter?: string; // ISO string
  startsBefore?: string; // ISO string
  actors?: string;
  directors?: string;
  pgRating?: string;
  cinemaId?: string;
}

const buildFilters = (filters?: MovieFilters) => ({
  title: filters?.title,
  imdb_rating: filters?.imdbMin,
  rotten_tomatoes_rating: filters?.rottenTomatoesMin,
  starts_after: filters?.startsAfter,
  starts_before: filters?.startsBefore,
  actors: filters?.actors,
  directors: filters?.directors,
  pg_rating: filters?.pgRating,
  cinema: filters?.cinemaId,
});

export const fetchMovies = (filters?: MovieFilters) =>
  apiGet<Movie[]>("/movies", { query: buildFilters(filters) });

// Search for a movie by title to get its full details
export const fetchMovieById = (title: string) =>
  apiGet<Movie[]>("/movies", { query: { title } }).then((movies) => movies?.[0] || null);

export const fetchUpcomingMovies = () => apiGet<UpcomingMovie[]>("/upcoming");

export const fetchMovieShowtimes = (movieId: string, cinemaId?: string) =>
  apiGet<ShowTime[]>(`/movies/${movieId}/showtimes`, {
    query: cinemaId ? { cinema_id: cinemaId } : undefined,
  });

