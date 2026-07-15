package com.example.backend.controller;

import com.example.backend.dto.MovieDto;
import com.example.backend.entity.Movie;
import com.example.backend.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/movies", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
@CrossOrigin(origins = "*")
public class MovieController {

    @Autowired
    private MovieRepository movieRepository;

    @GetMapping
    public ResponseEntity<List<MovieDto>> getAllMovies() {
        List<MovieDto> movies = movieRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(movies);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieDto> getMovieById(@PathVariable Long id) {
        return movieRepository.findById(id)
                .map(movie -> ResponseEntity.ok(convertToDto(movie)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MovieDto> createMovie(@RequestBody MovieDto movieDto) {
        Movie movie = convertToEntity(movieDto);
        Movie saved = movieRepository.save(movie);
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MovieDto> updateMovie(@PathVariable Long id, @RequestBody MovieDto movieDto) {
        return movieRepository.findById(id)
                .map(existingMovie -> {
                    updateEntityFromDto(existingMovie, movieDto);
                    Movie updated = movieRepository.save(existingMovie);
                    return ResponseEntity.ok(convertToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        if (movieRepository.existsById(id)) {
            movieRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    private MovieDto convertToDto(Movie movie) {
        return MovieDto.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .genres(movie.getGenres())
                .description(movie.getDescription())
                .rating(movie.getRating())
                .duration(movie.getDuration())
                .poster(movie.getPoster())
                .director(movie.getDirector())
                .cast(movie.getCast())
                .language(movie.getLanguage())
                .releaseDate(movie.getReleaseDate())
                .ageRating(movie.getAgeRating())
                .trailerUrl(movie.getTrailerUrl())
                .build();
    }

    private Movie convertToEntity(MovieDto dto) {
        return Movie.builder()
                .title(dto.getTitle())
                .genres(dto.getGenres())
                .description(dto.getDescription())
                .rating(dto.getRating())
                .duration(dto.getDuration())
                .poster(dto.getPoster())
                .director(dto.getDirector())
                .cast(dto.getCast())
                .language(dto.getLanguage())
                .releaseDate(dto.getReleaseDate())
                .ageRating(dto.getAgeRating())
                .trailerUrl(dto.getTrailerUrl())
                .build();
    }

    private void updateEntityFromDto(Movie movie, MovieDto dto) {
        if (dto.getTitle() != null) movie.setTitle(dto.getTitle());
        if (dto.getGenres() != null) movie.setGenres(dto.getGenres());
        if (dto.getDescription() != null) movie.setDescription(dto.getDescription());
        if (dto.getRating() != null) movie.setRating(dto.getRating());
        if (dto.getDuration() != null) movie.setDuration(dto.getDuration());
        if (dto.getPoster() != null) movie.setPoster(dto.getPoster());
        if (dto.getDirector() != null) movie.setDirector(dto.getDirector());
        if (dto.getCast() != null) movie.setCast(dto.getCast());
        if (dto.getLanguage() != null) movie.setLanguage(dto.getLanguage());
        if (dto.getReleaseDate() != null) movie.setReleaseDate(dto.getReleaseDate());
        if (dto.getAgeRating() != null) movie.setAgeRating(dto.getAgeRating());
        if (dto.getTrailerUrl() != null) movie.setTrailerUrl(dto.getTrailerUrl());
    }
}
