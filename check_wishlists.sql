SELECT id, name, movie_ids, array_length(movie_ids, 1) as count 
FROM wishlists 
WHERE user_id = 'auth0|691ef981071b76a4cba6daae'
ORDER BY created_at;
