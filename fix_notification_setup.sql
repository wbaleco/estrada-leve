-- 1. Create user_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('like_post', 'comment_post', 'like_workout', 'comment_workout', 'system')),
    title TEXT,
    message TEXT,
    reference_id UUID,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- 3. DROP EXISTING POLICIES TO PREVENT ERROR 42710
DROP POLICY IF EXISTS "Users can view their own notifications" ON user_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications (mark as read)" ON user_notifications;

-- 4. CREATE POLICIES
CREATE POLICY "Users can view their own notifications" ON user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON user_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications (mark as read)" ON user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. FUNCTION: Social Interactions
CREATE OR REPLACE FUNCTION handle_social_interaction() RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    actor_name TEXT;
    post_snippet TEXT;
BEGIN
    SELECT nickname INTO actor_name FROM user_stats WHERE user_id = auth.uid();
    IF actor_name IS NULL THEN actor_name := 'Alguém'; END IF;

    IF TG_TABLE_NAME = 'post_likes' THEN
        SELECT user_id, left(text, 20) INTO target_user_id, post_snippet FROM social_posts WHERE id = NEW.post_id;
        IF target_user_id != auth.uid() THEN
            INSERT INTO user_notifications (user_id, actor_id, type, title, message, reference_id)
            VALUES (target_user_id, auth.uid(), 'like_post', 'Curtida', actor_name || ' curtiu sua resenha: "' || post_snippet || '..."', NEW.post_id);
        END IF;

    ELSIF TG_TABLE_NAME = 'post_comments' THEN
        SELECT user_id, left(text, 20) INTO target_user_id, post_snippet FROM social_posts WHERE id = NEW.post_id;
        IF target_user_id != auth.uid() THEN
            INSERT INTO user_notifications (user_id, actor_id, type, title, message, reference_id)
            VALUES (target_user_id, auth.uid(), 'comment_post', 'Comentário', actor_name || ' comentou: "' || left(NEW.text, 20) || '..."', NEW.post_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCTION: Workout Interactions
CREATE OR REPLACE FUNCTION handle_workout_interaction() RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    actor_name TEXT;
BEGIN
    SELECT nickname INTO actor_name FROM user_stats WHERE user_id = auth.uid();
    IF actor_name IS NULL THEN actor_name := 'Alguém'; END IF;

    IF TG_TABLE_NAME = 'workout_likes' THEN
        SELECT user_id INTO target_user_id FROM workouts WHERE id = NEW.workout_id;
        IF target_user_id != auth.uid() THEN
            INSERT INTO user_notifications (user_id, actor_id, type, title, message, reference_id)
            VALUES (target_user_id, auth.uid(), 'like_workout', 'Curtida no Treino', actor_name || ' curtiu seu treino!', NEW.workout_id);
        END IF;

    ELSIF TG_TABLE_NAME = 'workout_comments' THEN
        SELECT user_id INTO target_user_id FROM workouts WHERE id = NEW.workout_id;
        IF target_user_id != auth.uid() THEN
            INSERT INTO user_notifications (user_id, actor_id, type, title, message, reference_id)
            VALUES (target_user_id, auth.uid(), 'comment_workout', 'Comentário no Treino', actor_name || ' comentou no seu treino!', NEW.workout_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RECREATE TRIGGERS (Safe Drops)
DROP TRIGGER IF EXISTS on_post_like ON post_likes;
DROP TRIGGER IF EXISTS on_post_comment ON post_comments;
DROP TRIGGER IF EXISTS on_workout_like ON workout_likes;
DROP TRIGGER IF EXISTS on_workout_comment ON workout_comments;

CREATE TRIGGER on_post_like AFTER INSERT ON post_likes FOR EACH ROW EXECUTE FUNCTION handle_social_interaction();
CREATE TRIGGER on_post_comment AFTER INSERT ON post_comments FOR EACH ROW EXECUTE FUNCTION handle_social_interaction();
CREATE TRIGGER on_workout_like AFTER INSERT ON workout_likes FOR EACH ROW EXECUTE FUNCTION handle_workout_interaction();
CREATE TRIGGER on_workout_comment AFTER INSERT ON workout_comments FOR EACH ROW EXECUTE FUNCTION handle_workout_interaction();
