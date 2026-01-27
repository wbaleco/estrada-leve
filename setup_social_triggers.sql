-- Function to update social post likes
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE social_posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE social_posts
        SET likes_count = likes_count - 1
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post likes
DROP TRIGGER IF EXISTS on_post_like ON post_likes;
CREATE TRIGGER on_post_like
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Function to update social post comments
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE social_posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE social_posts
        SET comments_count = comments_count - 1
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post comments
DROP TRIGGER IF EXISTS on_post_comment ON post_comments;
CREATE TRIGGER on_post_comment
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to update workout likes
CREATE OR REPLACE FUNCTION update_workout_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE workout_recordings
        SET likes_count = likes_count + 1
        WHERE id = NEW.workout_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE workout_recordings
        SET likes_count = likes_count - 1
        WHERE id = OLD.workout_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for workout likes
DROP TRIGGER IF EXISTS on_workout_like ON workout_likes;
CREATE TRIGGER on_workout_like
AFTER INSERT OR DELETE ON workout_likes
FOR EACH ROW EXECUTE FUNCTION update_workout_likes_count();

-- Function to update workout comments
CREATE OR REPLACE FUNCTION update_workout_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE workout_recordings
        SET comments_count = comments_count + 1
        WHERE id = NEW.workout_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE workout_recordings
        SET comments_count = comments_count - 1
        WHERE id = OLD.workout_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for workout comments
DROP TRIGGER IF EXISTS on_workout_comment ON workout_comments;
CREATE TRIGGER on_workout_comment
AFTER INSERT OR DELETE ON workout_comments
FOR EACH ROW EXECUTE FUNCTION update_workout_comments_count();

-- Recalculate existing counts
UPDATE social_posts p
SET 
    likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id),
    comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id);

UPDATE workout_recordings w
SET 
    likes_count = (SELECT COUNT(*) FROM workout_likes WHERE workout_id = w.id),
    comments_count = (SELECT COUNT(*) FROM workout_comments WHERE workout_id = w.id);
