export interface Ratings {
    imdb?: number;
    rottenTomatoes?: number;
    user?: string;
}

export interface Trailer {
    url: string;
    type?: string;
    thumbnail?: string;
}

export interface ShowTime {
	cinemaId?: string;
	startsAt?: string; // ISO string
	time?: string; // API format like "13:00 (1)"
	purchaseUrl?: string;
	purchase_url?: string;
	auditorium?: string;
}

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
    country?: string;
    ratings?: Ratings;
};

export interface UpcomingMovie extends Movie {
	releaseDate?: string;
}

export interface Cinema {
	id: string;
	name: string;
	description?: string;
	address?: {
		street?: string;
		city?: string;
		zipcode?: string;
	} | string;
	city?: string;
	phone?: string;
	website?: string;
	image?: string;
	location?: {
		lat: number;
		lon: number;
	};
}

export type Theater = {
    _id?: string;
    id?: string;
    name: string;
    website?: string;
    description?: string;
    address?: {
      street?: string;
      city?: string;
      zipcode?: string;
    } | string;
    phone?: string;
    [k: string]: any;
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


export type MovieFilters = {
    title?: string;
    imdbRating?: { min: number; max: number };
    tomatoRating?: { min: number; max: number };
    showtimeRange?: { start: string };
    actors?: string[];
    directors?: string[];
    pgRating?: string;
}