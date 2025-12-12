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
  return builtFilters;
};

export const fetchMovies = async (filters?: MovieFilters) => {
  const movies = await apiGet<any[]>("/movies", { query: buildFilters(filters) });
  
  // Deduplicate and normalize movies by ID
  const seen = new Set<string>();
  const uniqueRaw = movies.filter((movie) => {
    const id = String(movie.id || movie._id);
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });

  // Helper: try to fetch Rotten Tomatoes (or a best-effort fallback) from TMDB and/or OMDb
    const fetchRottenFromTmdb = async (tmdbId?: string) => {
    if (!tmdbId) return undefined;

    // Resolve API keys: prefer environment variables, fall back to a local testing file
    let tmdbKey = process.env.EXPO_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
    let omdbKey = process.env.EXPO_PUBLIC_OMDB_API_KEY || process.env.OMDB_API_KEY;
    if (!tmdbKey || !omdbKey) {
      try {
        // attempt to load an optional local file `src/config/testingKeys.ts`
        // that exports default { tmdbKey, omdbKey }
        // This file should NOT be committed; copy from testingKeys.example.ts
        // @ts-ignore: optional local testingKeys may not exist
        // eslint-disable-next-line import/no-unresolved
        const mod = await import('../config/testingKeys');
        const localKeys = mod?.default;
        tmdbKey = tmdbKey || localKeys?.tmdbKey;
        omdbKey = omdbKey || localKeys?.omdbKey;
      } catch {
        // ignore if not present
      }
    }

    if (!tmdbKey) {
      // No TMDB key configured
      return undefined;
    }

    try {
      const extUrl = `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${tmdbKey}`;
      const ext = await apiGet<any>(extUrl, { skipAuth: true });
      const imdbId = ext?.imdb_id;

      if (imdbId && omdbKey) {
        try {
          const omdbUrl = `https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbKey}`;
          const om = await apiGet<any>(omdbUrl, { skipAuth: true });

          if (om) {
            if (om.tomatoMeter) {
              const parsed = parseInt(String(om.tomatoMeter), 10);
              if (!Number.isNaN(parsed)) return parsed;
            }

            if (Array.isArray(om.Ratings)) {
              const rt = om.Ratings.find((r: any) => r.Source === "Rotten Tomatoes");
              if (rt && rt.Value) {
                const parsed = parseInt(String(rt.Value).replace(/%/, ""), 10);
                if (!Number.isNaN(parsed)) return parsed;
              }
            }
          }
        } catch (e) {
          console.warn("OMDb lookup via TMDB imdb id failed:", e);
        }
      }

      // Fallback: use TMDB vote_average scaled to 0-100
      try {
        const movieUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbKey}`;
        const m = await apiGet<any>(movieUrl, { skipAuth: true });
        if (m && typeof m.vote_average === "number") {
          return Math.round(m.vote_average * 10);
        }
      } catch (e) {
        console.warn("TMDB movie details lookup failed:", e);
      }
    } catch (err) {
      console.warn("Error fetching external ids from TMDB:", err);
    }

    return undefined;
  };

  // Map and enrich movies; perform TMDB lookups in parallel for those missing RT
  const mappedPromises = uniqueRaw.map(async (movie): Promise<Movie> => {

    let rottenTomatoesScore: number | undefined;

    if (movie.omdb?.[0]?.tomatoMeter) {
      rottenTomatoesScore = parseInt(String(movie.omdb[0].tomatoMeter), 10);
    } else if (movie.ratings?.rotten_critics) {
      rottenTomatoesScore = parseInt(String(movie.ratings.rotten_critics), 10);
    } else if (movie.ratings?.rotten_audience) {
      rottenTomatoesScore = parseInt(String(movie.ratings.rotten_audience), 10);
    }

    if ((rottenTomatoesScore === undefined || Number.isNaN(rottenTomatoesScore)) && movie.trailers?.[0]?.id) {
      const tmdbId = String(movie.trailers[0].id);
      try {
        const fetched = await fetchRottenFromTmdb(tmdbId);
        if (typeof fetched === "number" && !Number.isNaN(fetched)) {
          rottenTomatoesScore = fetched;
        }
      } catch (e) {
        console.warn(`Failed to fetch Rotten Tomatoes via TMDB for ${movie.title} (${tmdbId}):`, e);
      }
    }

    // If there's no numeric Rotten Tomatoes score (or it's 0), represent it explicitly as "N/A"
    const normalizedRotten = (typeof rottenTomatoesScore === 'number' && !Number.isNaN(rottenTomatoesScore) && rottenTomatoesScore > 0)
      ? rottenTomatoesScore
      : "N/A";

    const ratings: any = {
      imdb: movie.ratings?.imdb ? parseFloat(String(movie.ratings.imdb)) : undefined,
      rottenTomatoes: normalizedRotten,
    };

    // Normalize people and other fields so Movie screen can render them consistently
    const normalizeNames = (arr: any) => {
      if (!arr) return undefined;
      if (!Array.isArray(arr)) return undefined;
      const names = arr.map((it: any) => {
        if (!it) return undefined;
        if (typeof it === "string") return it;
        // common shapes: { name }, { Name }, { NameEN }
        return it.name || it.Name || it.NameEN || undefined;
      }).filter(Boolean) as string[];
      return names.length > 0 ? names : undefined;
    };

    const normalizeGenres = (g: any): string[] | undefined => {
      if (!g) return undefined;
      if (Array.isArray(g)) {
        const names = g.map((it: any) => {
          if (!it) return undefined;
          if (typeof it === 'string') return it;
          return it.name || it.Name || it.NameEN || undefined;
        }).filter(Boolean) as string[];
        return names.length > 0 ? names : undefined;
      }
      // single object or string
      if (typeof g === 'string') return [g];
      if (typeof g === 'object') {
        const n = g.name || g.Name || g.NameEN || undefined;
        return n ? [n] : undefined;
      }
      return undefined;
    };

    const actors = normalizeNames(movie.actors_abridged) || normalizeNames(movie.actors) || movie.actors;
    const directors = normalizeNames(movie.directors_abridged) || normalizeNames(movie.directors) || movie.directors;
    const writers = normalizeNames(movie.writers_abridged) || normalizeNames(movie.writers) || movie.writers;

    const country = movie.country || movie.countryOfOrigin || movie.origin || movie.origin_country || movie.production_country;

    // Normalize content rating (PG, etc.) from common fields — ensure it's a string (not an object)
    const rawRating =
      movie.rating || movie.contentRating || movie.pg_rating || movie.certificate || movie.certificateIS || movie.rated || movie.mpaaRating || undefined;

    const normalizeRating = (r: any): string | undefined => {
      if (r === undefined || r === null) return undefined;
      if (typeof r === "string") {
        const s = r.trim();
        return s === "" ? undefined : s;
      }
      if (typeof r === "number") return String(r);
      if (typeof r === "object") {
        // common keys where rating might be stored
        const candidates = ["rating", "name", "Name", "NameEN", "value", "is", "number", "code"];
        for (const k of candidates) {
          const v = (r as any)[k];
          if (v !== undefined && v !== null) {
            if (typeof v === "string") {
              const s = v.trim();
              if (s) return s;
            }
            if (typeof v === "number") return String(v);
          }
        }
        // Fallback: JSON stringify small object
        try {
          const s = JSON.stringify(r);
          return s.length > 0 ? s : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const ratingVal = normalizeRating(rawRating);

    return {
      ...movie,
      id: typeof movie.id === 'string' ? parseInt(movie.id, 10) : (movie.id || 0),
      actors,
      directors,
      writers,
      genres: normalizeGenres(movie.genres) || undefined,
      country,
      rating: ratingVal,
      ratings: ratings.imdb || ratings.rottenTomatoes ? ratings : undefined,
    };
  });

  const unique = await Promise.all(mappedPromises);
  
  // fetchMovies summary log removed to reduce noisy debug output in production/dev logs.
  return unique;
};

// Search for a movie by title to get its full details
export const fetchMovieById = (title: string) =>
  apiGet<Movie[]>("/movies", { query: { title } }).then((movies) => movies?.[0] || null);

export const fetchUpcomingMovies = async (): Promise<UpcomingMovie[]> => {
  const items = await apiGet<UpcomingMovie[]>('/upcoming');
  if (!Array.isArray(items)) return [];

  // Deduplicate by a stable identifier (prefer id or _id, fallback to title)
  const seen = new Set<string>();
  const unique: UpcomingMovie[] = [];

  for (const it of items) {
    const key = String(it?.id ?? (it as any)?._id ?? it?.title ?? '');
    if (!key) {
      // If nothing usable, try to stringify minimal identifying fields
      const alt = JSON.stringify({ title: it?.title, poster: it?.poster, year: it?.year });
      if (seen.has(alt)) continue;
      seen.add(alt);
      unique.push(it);
      continue;
    }

    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(it);
  }

  return unique;
};

export const fetchMovieShowtimes = (movieId: string, cinemaId?: string) =>
  apiGet<ShowTime[]>(`/movies/${movieId}/showtimes`, {
    query: cinemaId ? { cinema_id: cinemaId } : undefined,
  });

