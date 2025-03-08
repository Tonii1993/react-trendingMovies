import { useState, useEffect } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import useDebounce from "./components/useDebounce";
import { updateSearchCount, getTrendingMovies } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [movies, setMovies] = useState([]);
  const [errorMessages, setErrorMessages] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [errorTrending, setErrorTrending] = useState("");
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessages("");
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.response === "False") {
        setErrorMessages(data.Error || "No movies found");
        setMovies([]);
        return;
      }
      setMovies(data.results || []);

      // Update search count
      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessages("Error fetching movies. Please try again later");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    setIsLoadingTrending(true);
    setErrorTrending("");
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error loading trending movies: ${error}`);
      setErrorTrending("Error loading trending movies. Please try again later");
    } finally {
      setIsLoadingTrending(false);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern">
        <div className="wrapper">
          <header>
            <img src="./hero-img.png" alt="Hero Banner" />
            <h1>
              Find <span className="text-gradient">Movies</span>You'll Enjoy
              Without the Hassle
            </h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </header>

          {trendingMovies.length > 0 && (
            <section className="trending">
              <h2>Trending Movies</h2>
              {isLoadingTrending ? (
                <div className="flex justify-center items-center">
                  <Spinner />
                </div>
              ) : errorTrending ? (
                <p className="text-red-500">{errorTrending}</p>
              ) : (
                <ul>
                  {trendingMovies.map((movie, idx) => (
                    <li key={movie.$id}>
                      <p>{idx + 1}</p>
                      <img src={movie.poster_url} alt={movie.title} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="all-movies">
            <h1>All Movies</h1>
            {isLoading ? (
              <div className="flex justify-center items-center">
                <Spinner />
              </div>
            ) : errorMessages ? (
              <p className="text-red-500">{errorMessages}</p>
            ) : (
              <ul>
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
