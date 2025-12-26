
-- 1. Create the 'workouts' bucket for video recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workouts', 'workouts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies for 'workouts' bucket
CREATE POLICY "Workout videos are publicly accessible" ON storage.objects 
FOR SELECT USING ( bucket_id = 'workouts' );

CREATE POLICY "Users can upload workout videos" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'workouts' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own workout videos" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'workouts' AND owner = auth.uid()
);

-- 3. Table for Workout Recordings
CREATE TABLE IF NOT EXISTS workout_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    video_url TEXT NOT NULL,
    points_earned INTEGER DEFAULT 200,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE workout_recordings ENABLE ROW LEVEL SECURITY;

-- Políticas para Workout Recordings
CREATE POLICY "Qualquer um pode ver registros de treino" ON workout_recordings FOR SELECT USING (true);
CREATE POLICY "Usuários podem registrar seus próprios treinos" ON workout_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Função para atualizar pontos automaticamente ao registrar vídeo
CREATE OR REPLACE FUNCTION handle_workout_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_stats
    SET points = points + NEW.points_earned
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_workout_recorded
    AFTER INSERT ON workout_recordings
    FOR EACH ROW
    EXECUTE FUNCTION handle_workout_points();
