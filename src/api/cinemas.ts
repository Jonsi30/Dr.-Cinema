import { Cinema, Movie, ShowTime } from "../types/types";
import { apiGet } from "./client";

export const fetchCinemas = () => apiGet<Cinema[]>("/theaters");

export const fetchCinemaById = (id: string) => apiGet<Cinema>(`/theaters/${id}`);

export const fetchCinemaMovies = (id: string) => apiGet<Movie[]>(`/theaters/${id}/movies`);

export const fetchCinemaShowtimes = (id: string) => apiGet<ShowTime[]>(`/theaters/${id}/showtimes`);
