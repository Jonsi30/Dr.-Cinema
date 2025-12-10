import { useEffect, useState } from "react";
import { getAllCinemas, getAllMovies } from "../services/movieService";
import { Movie, MovieFilters, Theater } from "../types/types";


export function useMovies() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<MovieFilters>({});

    useEffect(() => {
        loadMoviesAndCinemas();
    }, []);

    const loadMoviesAndCinemas = async () => {
        setLoading(true);
        try {
            const [moviesData, cinemasData] = await Promise.all([
                getAllMovies(),
                getAllCinemas()
            ]);
            setMovies(moviesData)
            setTheaters(cinemasData)
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = (movies: Movie[]): Movie[] => {
        return movies.filter(movie => {
            //Title filter
            if (filters.title && !movie.title.toLowerCase().includes(filters.title.toLowerCase())){
                return false;
            }

            //IMDB rating filter 
            if (filters.imdbRating) {
                const imdbRating = parseFloat(movie.omdb?.imdbRating || "0");
                if (imdbRating < filters.imdbRating.min || imdbRating > filters.imdbRating.max) {
                    return false;
                }
            }

            //Rotten Tomatoes rating filter
            if (filters.tomatoRating) {
                const tomatoRating = parseFloat(movie.omdb?.tomatoRating?.replace("%", "") || "0");
                if (tomatoRating < filters.tomatoRating.min || tomatoRating > filters.tomatoRating.max) {
                    return false;
                }
            }

            //Showtime range filter
            if (filters.showtimeRange) {
                const hasMatchingShowtime = movie.showtimes.some(showtime => {
                    // Extract time part (e.g., "20:00" from "20:00 (r)")
                    const timeStr = showtime.time.split(' ')[0];
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    if (isNaN(hours) || isNaN(minutes)) return false;  // Invalid time, skip
                    
                    // Convert to minutes since midnight
                    const showtimeMinutes = hours * 60 + minutes;
                    
                    // Parse filter start/end to minutes (assuming "HH:MM" format)
                    const startStr = filters.showtimeRange!.start;
                    const endStr = filters.showtimeRange!.end;
                    const [startHours, startMinutes] = startStr.split(':').map(Number);
                    const [endHours, endMinutes] = endStr.split(':').map(Number);
                    if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) return false;
                    
                    const startMinutesTotal = startHours * 60 + startMinutes;
                    const endMinutesTotal = endHours * 60 + endMinutes;
                    
                    return showtimeMinutes >= startMinutesTotal && showtimeMinutes <= endMinutesTotal;
                });
                if (!hasMatchingShowtime) return false;
            }

            //Actors filter
            if (filters.actors && filters.actors.length > 0) {
                const hasActor = filters.actors.some(actor =>
                    movie.actors.some(movieActor => movieActor.toLowerCase().includes(actor.toLowerCase()))
                );
                if (!hasActor) {
                    return false;
                }
            }

            //Directors filter
            if (filters.directors && filters.directors.length > 0) {
                const hasDirector = filters.directors.some(director =>
                  movie.directors.some(movieDirector => movieDirector.toLowerCase().includes(director.toLowerCase()))
                );
                if (!hasDirector) return false;
              }
        
            // PG rating filter
            if (filters.pgRating && movie.omdb?.rated !== filters.pgRating) {
                return false;
            }

            return true;
        });
    };

    const filteredMovies = applyFilters(movies);

    return { movies: filteredMovies, allMovies: movies, theaters, loading, filters, setFilters, refresh: loadMoviesAndCinemas};
}