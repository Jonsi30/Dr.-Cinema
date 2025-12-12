import { useEffect, useState } from 'react';
import { getAllMovies, getAllTheaters } from '../services/movieService';
import { Movie, MovieFilters, Theater } from '../types/types';

export function useMovies() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<MovieFilters>({});
  
    useEffect(() => {
        console.log("Starting load...");
        loadMoviesAndTheaters();
    }, []);  // Only load once

    const loadMoviesAndTheaters = async () => {
        setLoading(true); 
        try {
            const [moviesData, theatersData] = await Promise.all([
                getAllMovies(),  
                getAllTheaters()
            ]);
            console.log("Movies fetched:", moviesData.length);
            setMovies(moviesData);
            setTheaters(theatersData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);  
            console.log("Loading set to false");
        }
    };

    const applyFilters = (movies: Movie[]): Movie[] => {
        return movies.filter(movie => {
            console.log("Checking movie:", movie.title);
            // Title filter
            if (filters.title) {
                const matches = movie.title?.toLowerCase().includes(filters.title.toLowerCase());
                console.log("Title filter:", filters.title, "matches:", matches);
                if (!matches) return false;
            }
            // IMDB rating filter
            if (filters.imdbRating) {
                const rating = parseFloat(movie.omdb?.imdbRating || "0");
                const matches = rating >= filters.imdbRating.min && rating <= filters.imdbRating.max;
                console.log("IMDB filter:", filters.imdbRating, "movie rating:", rating, "matches:", matches);
                if (!matches) return false;
            }
            // PG rating filter 
            if (filters.pgRating) {
                const matches = movie.omdb?.rated === filters.pgRating;
                console.log("PG filter:", filters.pgRating, "movie rated:", movie.omdb?.rated, "matches:", matches);
                if (!matches) return false;
            }
            // Actors filter
            if (filters.actors && filters.actors.length > 0) {
                const matches = filters.actors.some(actor =>
                movie.actors.some(movieActor => movieActor.toLowerCase().includes(actor.toLowerCase()))
                );
                console.log("Actors filter:", filters.actors, "movie actors:", movie.actors, "matches:", matches);
                if (!matches) return false;
            }
            if (filters.directors && filters.directors.length > 0) {
                const matches = filters.directors.some(director =>
                movie.directors.some(movieDirector => movieDirector.toLowerCase().includes(director.toLowerCase()))
                );
                console.log("Directors filter:", filters.directors, "movie directors:", movie.directors, "matches:", matches);
                if (!matches) return false;
            }
            if (filters.showtimeRange) {
                const timeToMinutes = (time: string): number => {
                    if (!time) return 0;
                    // replace dots with colons, and remove everything after the first space or parenthesis
                    let cleaned = time.replace('.', ':').split(' ')[0].split('(')[0].trim();
                    const match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
                    if (!match) return 0;  // Invalid format, skip
                    const hours = parseInt(match[1], 10);
                    const minutes = parseInt(match[2], 10);
                    return hours * 60 + minutes;
                };
                
                const startMinutes = timeToMinutes(filters.showtimeRange.start);
                const endMinutes = timeToMinutes((filters.showtimeRange as any).end ?? filters.showtimeRange.start);
                
                // Check if any showtime starts within the range
                const matches = movie.showtimes?.some((showtime: any) => {
                    const showtimeStr = showtime.time;  
                    if (!showtimeStr) return false;
                    const showtimeMinutes = timeToMinutes(showtimeStr);
                    console.log(`Checking showtime "${showtimeStr}" -> ${showtimeMinutes} minutes (range: ${startMinutes}-${endMinutes})`);
                    return showtimeMinutes >= startMinutes && showtimeMinutes <= endMinutes;
                }) || false;
                
                console.log("Showtime start range filter:", filters.showtimeRange, "matches:", matches);
                if (!matches) return false;
            }
            
            return true;
        });
    };

    const filteredMovies = applyFilters(movies);

    return { movies: filteredMovies, theaters, loading, filters, setFilters, refresh: loadMoviesAndTheaters };
}

