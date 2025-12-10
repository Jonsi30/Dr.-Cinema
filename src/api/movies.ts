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

const buildFilters = (filters?: MovieFilters) => {
  const builtFilters = {
    title: filters?.title,
    imdb_rating: filters?.imdbMin,
    rotten_tomatoes_rating: filters?.rottenTomatoesMin,
    starts_after: filters?.startsAfter,
    starts_before: filters?.startsBefore,
    actors: filters?.actors,
    directors: filters?.directors,
    pg_rating: filters?.pgRating,
    cinema: filters?.cinemaId,
  };
  console.log("buildFilters - input:", filters);
  console.log("buildFilters - output:", builtFilters);
  return builtFilters;
};

export const fetchMovies = async (filters?: MovieFilters) => {
  console.log("fetchMovies called with filters:", filters);
  const movies = await apiGet<any[]>("/movies", { query: buildFilters(filters) });
  
  console.log(`fetchMovies: Received ${movies.length} movies from API`);
  
  // Deduplicate and normalize movies by ID
  const seen = new Set<string>();
  const unique = movies.filter((movie) => {
    const id = String(movie.id || movie._id);
    if (seen.has(id)) {
      console.warn(`Duplicate movie detected: ${movie.title} (ID: ${id})`);
      return false;
    }
    seen.add(id);
    return true;
  }).map((movie): Movie => {
    // Log raw ratings to see what the API returns
    if (movie.ratings) {
      console.log(`Ratings for ${movie.title}:`, movie.ratings);
    }
    
    // Normalize ratings to ensure rottenTomatoes is included
    const ratings: any = {
      imdb: movie.ratings?.imdb ? parseFloat(String(movie.ratings.imdb)) : undefined,
      rottenTomatoes: movie.ratings?.rotten_critics ? parseFloat(String(movie.ratings.rotten_critics)) : 
                      movie.ratings?.rotten_audience ? parseFloat(String(movie.ratings.rotten_audience)) : undefined,
    };
    
    return {
      ...movie,
      id: typeof movie.id === 'string' ? parseInt(movie.id, 10) : (movie.id || 0),
      ratings: ratings.imdb || ratings.rottenTomatoes ? ratings : undefined,
    };
  });
  
  console.log(`fetchMovies: ${movies.length} total, ${unique.length} unique after deduplication`);
  return unique;
};

// Search for a movie by title to get its full details
export const fetchMovieById = (title: string) =>
  apiGet<Movie[]>("/movies", { query: { title } }).then((movies) => movies?.[0] || null);

export const fetchUpcomingMovies = () => apiGet<UpcomingMovie[]>("/upcoming");

export const fetchMovieShowtimes = (movieId: string, cinemaId?: string) =>
  apiGet<ShowTime[]>(`/movies/${movieId}/showtimes`, {
    query: cinemaId ? { cinema_id: cinemaId } : undefined,
  });

