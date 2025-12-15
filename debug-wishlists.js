// Debug script to check wishlists data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWishlists() {
  const userId = 'auth0|691ef981071b76a4cba6daae';
  
  const { data: wishlists, error } = await supabase
    .from('wishlists')
    .select('id, name, movie_ids')
    .eq('user_id', userId)
    .order('created_at');
  
  if (error) {
    console.error('Error fetching wishlists:', error);
    return;
  }
  
  console.log('\n=== WISHLISTS DATA ===\n');
  
  let allMovies = [];
  wishlists.forEach((wishlist, index) => {
    const movieIds = wishlist.movie_ids || [];
    console.log(`${index + 1}. "${wishlist.name}"`);
    console.log(`   ID: ${wishlist.id}`);
    console.log(`   Movies: ${JSON.stringify(movieIds)}`);
    console.log(`   Count: ${movieIds.length}`);
    console.log('');
    
    allMovies = allMovies.concat(movieIds);
  });
  
  console.log(`Total movie entries: ${allMovies.length}`);
  console.log(`Unique movies: ${new Set(allMovies).size}`);
  console.log(`All movie IDs: ${JSON.stringify(allMovies)}`);
  console.log(`Unique movie IDs: ${JSON.stringify([...new Set(allMovies)])}`);
}

checkWishlists();
