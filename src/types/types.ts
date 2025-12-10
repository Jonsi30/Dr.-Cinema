export interface Ratings {
	imdb?: number;
	rottenTomatoes?: number;
	user?: number;
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
	id: string;
	title: string;
	year?: number;
	poster?: string;
	plot?: string;
	durationMinutes?: number;
	rating?: string;
	directors?: string[];
	writers?: string[];
	actors?: string[];
	genres?: string[];
	country?: string;
	contentRating?: string;
	trailers?: Trailer[];
	showtimes?: ShowTime[];
	schedule?: ShowTime[];
	ratings?: Ratings;
}

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
