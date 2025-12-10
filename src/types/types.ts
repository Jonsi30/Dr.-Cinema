export interface Movie {
    id: number;
    title: string;
    plot?: string;
    year?: string;
    poster?: string;
    durationMinutes?: number;
    omdb?: {
        imdbRating: string;
        tomatoRating: string;
        rated: string;
    };
    actors: string[];
    directors: string[];
    genres: string[];
    showtimes: {
        time: string;
        theater: { id: number };
    }[];
};

export type Genre = {
    ID: number;
    Name:string;
    NameEN: string;
};

export type Rating = {
    Source: string;
    Value: string;
};

export type Showtime = {
    time: string;
};

export type Theater = {
    id: number;
    name: string;
    website: string;
};

export type MovieFilters = {
    title?: string;
    imdbRating?: { min: number; max: number };
    tomatoRating?: { min: number; max: number };
    showtimeRange?: { start: string; end: string };
    actors?: string[];
    directors?: string[];
    pgRating?: string;
}