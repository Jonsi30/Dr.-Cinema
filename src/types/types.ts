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

export type Movie = {
  _id?: string;
  title: string;
  imdbid?: string;
  year?: number;
  genres?: string[];
  poster?: string; 
  showtimes?: {
    time: string; 
    theater: string | { _id?: string; name?: string };
  }[];
  [k: string]: any;
};
