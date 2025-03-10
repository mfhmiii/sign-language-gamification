-- Create a function to increment user stats (XP and coins)
create or replace function increment_user_stats(
  user_id uuid,
  xp_increment integer,
  coins_increment integer
) returns void as $$
begin
  update users
  set 
    xp = xp + xp_increment,
    coins = coins + coins_increment,
    updated_at = now()
  where id = user_id;
end;
$$ language plpgsql security definer; 