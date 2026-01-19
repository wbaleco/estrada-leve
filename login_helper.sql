
-- Function to lookup email via nickname for Login
CREATE OR REPLACE FUNCTION get_email_by_nickname(input_nickname TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges to access auth.users
AS $$
DECLARE
    found_email TEXT;
BEGIN
    SELECT u.email INTO found_email
    FROM auth.users u
    JOIN public.user_stats s ON s.user_id = u.id
    WHERE s.nickname ILIKE input_nickname -- Case insensitive matching
    LIMIT 1;
    
    RETURN found_email;
END;
$$;

-- Grant execute permission to public/anon
GRANT EXECUTE ON FUNCTION get_email_by_nickname TO anon, authenticated, service_role;
