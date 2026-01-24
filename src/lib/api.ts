
import { supabase } from './supabase';

export const api = {
    getUserStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase.from('user_stats')
            .select('*')
            .eq('user_id', user.id) // IMPORTANT: Explicit filter for when RLS is disabled
            .single();

        // If no rows, return null (handled in App.tsx to trigger onboarding)
        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('Error fetching user stats:', error);
            throw error;
        }

        // Map snake_case to camelCase
        return {
            day: data.day,
            totalDays: data.total_days,
            weightLost: data.weight_lost,
            points: data.points,
            currentWeight: data.current_weight,
            startWeight: data.start_weight,
            goalWeight: data.goal_weight,
            height: data.height,
            bmi: data.bmi,
            idealWeight: data.ideal_weight,
            nickname: data.nickname,
            avatarUrl: data.avatar_url,
            isAdmin: data.is_admin,
            waistCm: data.waist_cm,
            age: data.age,
            gender: data.gender
        };
    },

    getAllUsers: async () => {
        const { data, error } = await supabase.from('user_stats').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            day: d.day,
            nickname: d.nickname,
            currentWeight: d.current_weight,
            goalWeight: d.goal_weight,
            isAdmin: d.is_admin,
            points: d.points,
            avatarUrl: d.avatar_url
        }));
    },

    updateProfile: async (userId: string, updates: any) => {
        const { error } = await supabase.from('user_stats').update(updates).eq('user_id', userId);
        if (error) throw error;
    },

    deleteProfile: async (userId: string) => {
        // Agora chamamos um RPC que deleta tanto os dados quanto a conta de Auth
        // O Supabase não permite deletar de auth.users via cliente por segurança, 
        // então usamos este RPC com SECURITY DEFINER.
        const { error } = await supabase.rpc('delete_user_account_by_admin', {
            target_user_id: userId
        });

        if (error) {
            console.error('Erro no RPC de exclusão total:', error);
            // Fallback apenas para user_stats se o RPC falhar ou não estiver configurado
            const { error: fallbackError } = await supabase.from('user_stats').delete().eq('user_id', userId);
            if (fallbackError) throw fallbackError;
        }
    },

    deleteAuthAccount: async () => {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) throw error;
    },

    completeOnboarding: async (data: {
        nickname: string,
        weight: number,
        goal: number,
        height: number,
        bmi: number,
        idealWeight: number,
        avatarUrl: string,
        waistCm?: number,
        age?: number,
        gender?: string
    }) => {
        // 1. Create base profile via RPC
        const { error } = await supabase.rpc('complete_user_onboarding', {
            p_nickname: data.nickname,
            p_current_weight: data.weight,
            p_goal_weight: data.goal,
            p_height: data.height,
            p_bmi: data.bmi,
            p_ideal_weight: data.idealWeight,
            p_avatar_url: data.avatarUrl,
            p_waist_cm: data.waistCm
        });
        if (error) throw error;

        // 2. Update extra fields (Age/Gender) directly
        // This ensures compat without redefining the RPC signature in DB immediately
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_stats').update({
                age: data.age,
                gender: data.gender
            }).eq('user_id', user.id);

            // 3. Add initial weight entry to history so graph is not empty
            await supabase.from('goals_weight_history').insert({
                user_id: user.id,
                weight: data.weight,
                label: 'Início',
                date: new Date().toISOString()
            });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
    },

    createProfile: async (stats: any) => {
        // Try direct insert first (standard way)
        const { error } = await supabase.from('user_stats').insert(stats);

        if (error) {
            console.warn('Standard insert failed, trying RPC bypass...', error);
            // If RLS fails, try the secure RPC
            if (error.code === '42501' || error.message.includes('row-level security')) {
                const { error: rpcError } = await supabase.rpc('create_profile_secure', {
                    profile_data: stats
                });
                if (rpcError) throw rpcError;
            } else {
                throw error;
            }
        }
    },

    getActivities: async (type?: string) => {
        const user = (await supabase.auth.getUser()).data.user;
        let query = supabase.from('activities').select('*').order('created_at', { ascending: true });

        // Filter by user or public (user_id is null)
        if (user) {
            query = query.or(`user_id.eq.${user.id},user_id.is.null`);
        } else {
            query = query.is('user_id', null);
        }

        if (type && type !== 'all') {
            query = query.eq('type', type);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    toggleActivity: async (id: string, completed: boolean) => {
        const { error } = await supabase.from('activities').update({ completed }).eq('id', id);
        if (error) throw error;

        // Points logic
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
            const pointsToChange = completed ? 50 : -50;
            const { data: stats } = await supabase.from('user_stats').select('nickname, avatar_url, points').eq('user_id', user.id).single();

            if (stats) {
                // Update Points
                await supabase.from('user_stats').update({ points: (stats.points || 0) + pointsToChange }).eq('user_id', user.id);

                // --- NOVO: Postagem Social Automática ao concluir atividade ---
                if (completed) {
                    try {
                        const { data: activity } = await supabase.from('activities').select('title').eq('id', id).single();
                        await supabase.from('social_posts').insert({
                            name: stats.nickname || 'Parceiro',
                            user_avatar_url: stats.avatar_url,
                            text: `Concluí a atividade: ${activity?.title || 'Exercício'}! +50 pontos na conta. 🚛💨`,
                            time_ago: 'Agora',
                            color: 'primary',
                            user_id: user.id
                        });
                    } catch (err) {
                        console.error('Error creating activity social post:', err);
                    }
                }
            }
        }
        await api.checkAndAwardMedals().catch(console.error);
    },

    addActivity: async (activity: any) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase.from('activities').insert({
            ...activity,
            user_id: user.id
        });
        if (error) throw error;
    },

    getMeals: async (category?: string) => {
        const user = (await supabase.auth.getUser()).data.user;
        let query = supabase.from('meals').select('*');

        // Filter by user or public suggestions
        if (user) {
            query = query.or(`user_id.eq.${user.id},is_suggestion.eq.true`);
        } else {
            query = query.eq('is_suggestion', true);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    logMeal: async (meal: any) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase.from('meals').insert({
            ...meal,
            user_id: user.id,
            is_suggestion: false
        });
        if (error) {
            console.error('Supabase Insert Error:', error);
            throw error;
        }

        // --- NOVO: Adicionar 20 pontos por registrar refeição ---
        const { data: stats } = await supabase.from('user_stats').select('points, nickname, avatar_url').eq('user_id', user.id).single();
        if (stats) {
            await supabase.from('user_stats').update({ points: (stats.points || 0) + 20 }).eq('user_id', user.id);
        }

        // Automatic Social Post for the meal
        try {
            await supabase.from('social_posts').insert({
                name: stats?.nickname || 'Parceiro',
                user_avatar_url: stats?.avatar_url,
                text: `Acabei de bater um rangaço saudável: ${meal.name}! 🥗🍛`,
                time_ago: 'Agora',
                color: 'secondary',
                user_id: user.id
            });
        } catch (postErr) {
            console.error('Error creating automatic meal post:', postErr);
        }
        await api.checkAndAwardMedals().catch(console.error);
    },

    toggleMealConsumed: async (id: string, consumed: boolean) => {
        const { error } = await supabase.from('meals').update({ consumed }).eq('id', id);
        if (error) throw error;

        // Points logic
        const user = (await supabase.auth.getUser()).data.user;
        if (user && consumed) {
            const { data: stats } = await supabase.from('user_stats').select('points').eq('user_id', user.id).single();
            if (stats) {
                await supabase.from('user_stats').update({ points: (stats.points || 0) + 20 }).eq('user_id', user.id);
            }
        }
        await api.checkAndAwardMedals().catch(console.error);
    },

    getShoppingList: async () => {
        const { data, error } = await supabase.from('shopping_list').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    toggleShoppingItem: async (id: string, checked: boolean) => {
        const { error } = await supabase.from('shopping_list').update({ checked }).eq('id', id);
        if (error) throw error;
    },

    addShoppingItem: async (label: string) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase.from('shopping_list').insert({
            user_id: user.id,
            label,
            checked: false
        });
        if (error) throw error;
    },

    deleteShoppingItem: async (id: string) => {
        const { error } = await supabase.from('shopping_list').delete().eq('id', id);
        if (error) throw error;
    },

    getWeightHistory: async () => {
        const { data, error } = await supabase.from('goals_weight_history').select('*').order('date', { ascending: true });
        if (error) throw error;
        return data;
    },

    updateWeight: async (weight: number, waist?: number) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');

        // 1. Update user_stats
        const { data: stats } = await supabase.from('user_stats').select('start_weight').eq('user_id', user.id).single();
        const weightLost = stats ? (stats.start_weight - weight) : 0;

        const { error: updateError } = await supabase.from('user_stats').update({
            current_weight: weight,
            weight_lost: parseFloat(weightLost.toFixed(1)),
            waist_cm: waist
        }).eq('user_id', user.id);

        if (updateError) throw updateError;

        // 2. Add to history (Handle duplicate for today)
        const today = new Date().toISOString().split('T')[0];
        const label = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        // Check for existing entry today using limit(1) to avoid checking errors for 'not found'
        const { data: existing } = await supabase.from('goals_weight_history')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', today)
            .limit(1);

        const dailyEntry = existing?.[0];

        if (dailyEntry) {
            // Update existing entry for today
            const { error: upErr } = await supabase.from('goals_weight_history').update({
                weight: weight,
                waist: waist
            }).eq('id', dailyEntry.id);
            if (upErr) throw upErr;
        } else {
            // Insert new entry
            const { error: insErr } = await supabase.from('goals_weight_history').insert({
                user_id: user.id,
                weight: weight,
                waist: waist,
                label: label,
                date: today
            });
            if (insErr) throw insErr;
        }

        // Points for logging weight (e.g., 20 points)
        let pointsAwarded = false;
        if (stats && !dailyEntry) {
            const { data: currentStats } = await supabase.from('user_stats').select('points').eq('user_id', user.id).single();
            if (currentStats) {
                await supabase.from('user_stats').update({ points: (currentStats.points || 0) + 20 }).eq('user_id', user.id);
                pointsAwarded = true;
            }
        }

        // 3. Automatic Social Post (Only if new or significant change?)
        // Let's post every time to be responsive, or restrict. 
        // User expects feedback.
        try {
            const { data: userData } = await supabase.from('user_stats')
                .select('nickname, avatar_url, weight_lost')
                .eq('user_id', user.id)
                .single();

            if (userData) {
                await supabase.from('social_posts').insert({
                    user_id: user.id,
                    name: userData.nickname || 'Parceiro',
                    user_avatar_url: userData.avatar_url,
                    text: userData.weight_lost && userData.weight_lost > 0
                        ? `Atualizei meu peso! Já se foram ${userData.weight_lost}kg de carga pesada! ⚖️📉`
                        : `Peso registrado! Manutenção em dia para seguir viagem. ⚖️🚛`,
                    time_ago: 'Agora',
                    color: 'info'
                });
            }
        } catch (err) {
            console.error('Error creating weight social post:', err);
        }

        await api.checkAndAwardMedals().catch(console.error);
        return pointsAwarded;
    },

    getSocialPosts: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('social_posts')
            .select(`
                *,
                post_likes (user_id)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Process posts to include like info
        return data.map((post: any) => ({
            ...post,
            is_liked: user ? post.post_likes?.some((l: any) => l.user_id === user.id) : false,
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0
        }));
    },

    toggleLike: async (postId: string) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');

        // Check if already liked
        const { data: existing } = await supabase
            .from('post_likes')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            // Unlike
            const { error: delError } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);
            if (delError) throw delError;

            // Update count
            const { data: post } = await supabase.from('social_posts').select('likes_count').eq('id', postId).single();
            await supabase.from('social_posts').update({ likes_count: Math.max(0, (post?.likes_count || 0) - 1) }).eq('id', postId);
            return false;
        } else {
            // Like
            const { error: insError } = await supabase
                .from('post_likes')
                .insert({ post_id: postId, user_id: user.id });
            if (insError) throw insError;

            // Update count
            const { data: post } = await supabase.from('social_posts').select('likes_count').eq('id', postId).single();
            await supabase.from('social_posts').update({ likes_count: (post?.likes_count || 0) + 1 }).eq('id', postId);
            return true;
        }
    },

    getComments: async (postId: string) => {
        const { data, error } = await supabase
            .from('post_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    addComment: async (postId: string, text: string) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');

        const { data: stats } = await supabase.from('user_stats').select('nickname, avatar_url').eq('user_id', user.id).single();

        const { error } = await supabase.from('post_comments').insert({
            post_id: postId,
            user_id: user.id,
            user_name: stats?.nickname || 'Parceiro',
            user_avatar_url: stats?.avatar_url,
            text: text
        });
        if (error) throw error;

        // Update count
        const { data: post } = await supabase.from('social_posts').select('comments_count').eq('id', postId).single();
        await supabase.from('social_posts').update({ comments_count: (post?.comments_count || 0) + 1 }).eq('id', postId);
    },

    getWorkoutComments: async (workoutId: string) => {
        const { data, error } = await supabase
            .from('workout_comments')
            .select('*')
            .eq('workout_id', workoutId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    addWorkoutComment: async (workoutId: string, text: string) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');

        const { data: stats } = await supabase.from('user_stats').select('nickname, avatar_url').eq('user_id', user.id).single();

        const { error } = await supabase.from('workout_comments').insert({
            workout_id: workoutId,
            user_id: user.id,
            user_name: stats?.nickname || 'Parceiro',
            user_avatar_url: stats?.avatar_url,
            text: text
        });
        if (error) throw error;

        // Update count
        const { data: workout } = await supabase.from('workout_recordings').select('comments_count').eq('id', workoutId).single();
        await supabase.from('workout_recordings').update({ comments_count: (workout?.comments_count || 0) + 1 }).eq('id', workoutId);
    },

    addSocialPost: async (text: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: stats } = await supabase.from('user_stats').select('nickname, avatar_url, current_weight').eq('user_id', user.id).single();

        const { error } = await supabase.from('social_posts').insert({
            user_id: user.id,
            name: stats?.nickname || 'Parceiro',
            user_avatar_url: stats?.avatar_url,
            text: text,
            stats: stats?.current_weight ? `${stats.current_weight}kg` : null,
            time_ago: 'Agora mesmo', // Fallback for UI
            color: 'primary'
        });

        if (error) throw error;

        // Points for social interaction? +10 points
        if (stats) {
            const { data: currentStats } = await supabase.from('user_stats').select('points').eq('user_id', user.id).single();
            if (currentStats) {
                await supabase.from('user_stats').update({ points: (currentStats.points || 0) + 10 }).eq('user_id', user.id);
            }
        }
    },

    getDailyGoals: async () => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return [];

        // Check if goals exist for today, if not create them
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
            .from('daily_goals')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today);

        if (existing && existing.length > 0) {
            return existing;
        }

        // Default goals for a new day
        const defaults = [
            { type: 'hydration', label: 'Hidratação', target: 3, current: 0, unit: 'L', icon: 'water_drop', color: 'blue' },
            { type: 'movement', label: 'Movimento', target: 15, current: 0, unit: 'min', icon: 'directions_walk', color: 'orange' },
            { type: 'sleep', label: 'Sono de Qualidade', target: 8, current: 0, unit: 'h', icon: 'bedtime', color: 'purple' }
        ];

        const { data: created, error } = await supabase
            .from('daily_goals')
            .insert(defaults.map(d => ({ ...d, user_id: user.id, date: today })))
            .select();

        if (error) {
            console.error('Error creating daily goals:', error);
            return [];
        }
        return created;
    },

    updateDailyGoal: async (id: string, current: number) => {
        const { data: goal, error: fetchErr } = await supabase.from('daily_goals').select('*').eq('id', id).single();
        if (fetchErr || !goal) {
            console.error('Error fetching goal:', fetchErr);
            return;
        }

        const newCurrent = Math.min(goal.target, goal.current + (current || 0));
        const completed = newCurrent >= goal.target;

        const { error: updateErr } = await supabase
            .from('daily_goals')
            .update({ current: newCurrent, completed })
            .eq('id', id);

        if (updateErr) {
            console.error('Error updating goal progress:', updateErr);
            throw updateErr;
        }

        // --- NOVO: Pontuação por registro e conclusão ---
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: stats } = await supabase.from('user_stats').select('points').eq('user_id', user.id).single();
            if (stats) {
                let pointsToAdd = 5; // 5 pontos por cada registro (água, movimento, sono)

                // Bônus se completar a meta agora
                if (completed && !goal.completed) {
                    pointsToAdd += 20; // +20 de bônus por completar
                    console.log('Goal completed! Awarding bonus points...');
                }

                const newPoints = (stats.points || 0) + pointsToAdd;
                await supabase.from('user_stats').update({ points: newPoints }).eq('user_id', user.id);
                console.log(`Points updated: +${pointsToAdd} (Total: ${newPoints})`);

                // --- NOVO: Postagem Social Automática ao completar Meta ---
                if (completed && !goal.completed) {
                    try {
                        const { data: fullStats } = await supabase.from('user_stats').select('nickname, avatar_url').eq('user_id', user.id).single();
                        await supabase.from('social_posts').insert({
                            name: fullStats?.nickname || 'Parceiro',
                            user_avatar_url: fullStats?.avatar_url,
                            text: `Meta de ${goal.label} batida! Foco total na saúde! 🏆🏁`,
                            time_ago: 'Agora',
                            color: 'success',
                            user_id: user.id
                        });
                    } catch (err) {
                        console.error('Error creating goal social post:', err);
                    }
                }
            }
        }
        await api.checkAndAwardMedals().catch(console.error);
    },

    getResources: async (category?: string) => {
        let query = supabase.from('resources').select('*').order('created_at', { ascending: false });
        if (category && category !== 'Tudo') {
            query = query.eq('category', category);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    addResource: async (resource: { title: string, description: string, image: string, category: string, type: 'article' | 'video', url?: string, content?: string }) => {
        const { data: { user } } = await supabase.auth.getUser();

        // Include timestamp via select after insert or rely on client? Better to select.
        const { data, error } = await supabase.from('resources').insert([{
            ...resource,
            user_id: user?.id,
            created_at: new Date().toISOString() // Ensure latest is top sorted
        }]).select();

        if (error) throw error;

        // --- NOVO: Ganhar 100 pontos por contribuir com conteúdo ---
        if (user) {
            const { data: stats } = await supabase.from('user_stats').select('points, nickname, avatar_url').eq('user_id', user.id).single();
            if (stats) {
                await supabase.from('user_stats').update({ points: (stats.points || 0) + 100 }).eq('user_id', user.id);

                // --- NOVO: Postagem Social Automática sobre o novo recurso ---
                try {
                    await supabase.from('social_posts').insert({
                        name: stats.nickname || 'Parceiro',
                        user_avatar_url: stats.avatar_url,
                        text: `Compartilhei um novo conteúdo de valor: "${resource.title}". 💪📚`,
                        time_ago: 'Agora',
                        color: 'primary', // Or a different color for resources?
                        user_id: user.id
                    });
                } catch (err) {
                    console.error('Error creating resource social post:', err);
                }
            }
        }
        await api.checkAndAwardMedals().catch(console.error);
        return data;
    },

    uploadResourceFile: async (file: File) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');

        // Sanitize filename even more strictly
        const timestamp = Date.now();
        const safeName = file.name
            .normalize('NFD') // Remove accents
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Remove everything except alphanumeric, dots, dashes and underscores
            .replace(/\s+/g, '_'); // Just in case

        const fileName = `${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from('resource_files')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('resource_files')
            .getPublicUrl(fileName);

        return data.publicUrl;
    },

    uploadWorkoutVideo: async (file: File, caption?: string, activityId?: string) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');

        // Check file size (Supabase limit is usually 50MB)
        if (file.size > 50 * 1024 * 1024) {
            throw new Error('O vídeo é muito pesado! Máximo 50MB, parceiro.');
        }

        const fileName = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        console.log('Uploading workout video:', fileName);

        const { error: uploadError } = await supabase.storage
            .from('workouts')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('workouts')
            .getPublicUrl(fileName);

        console.log('Video uploaded, saving to DB:', publicUrl);

        const { error: insError } = await supabase.from('workout_recordings').insert({
            user_id: user.id,
            activity_id: activityId,
            video_url: publicUrl,
            caption: caption,
            points_earned: 200
        });

        if (insError) {
            console.error('Database insert error:', insError);
            throw insError;
        }

        // Automatic Social Post
        try {
            const { data: stats } = await supabase.from('user_stats').select('nickname, avatar_url').eq('user_id', user.id).single();
            await supabase.from('social_posts').insert({
                name: stats?.nickname || 'Parceiro',
                user_avatar_url: stats?.avatar_url,
                text: `Acabei de validar meu treino! +200 pontos no Ranking! 🏋️‍♂️🏆`,
                time_ago: 'Agora',
                color: 'primary',
                user_id: user.id
            });
        } catch (postErr) {
            console.error('Error creating automatic social post:', postErr);
        }
        await api.checkAndAwardMedals().catch(console.error);

        return publicUrl;
    },

    uploadMealImage: async (file: File) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');

        const fileName = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

        const { error: uploadError } = await supabase.storage
            .from('meals')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('meals')
            .getPublicUrl(fileName);

        return publicUrl;
    },

    getLeaderboard: async () => {
        const { data, error } = await supabase
            .from('user_stats')
            .select('nickname, avatar_url, points, current_weight')
            .order('points', { ascending: false })
            .limit(10);
        if (error) throw error;
        return data;
    },

    getRecentWorkouts: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('workout_recordings')
            .select(`
                id,
                user_id,
                video_url,
                caption,
                likes_count,
                comments_count,
                points_earned,
                created_at,
                user_stats (nickname, avatar_url),
                workout_likes(user_id)
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error in getRecentWorkouts:', error);
            // Fallback: try without the join to at least show the videos
            const { data: fallback, error: fError } = await supabase.from('workout_recordings').select('*').order('created_at', { ascending: false });
            if (fError) throw fError;
            return fallback || [];
        }

        return data.map((w: any) => ({
            ...w,
            is_liked: user ? w.workout_likes?.some((l: any) => l.user_id === user.id) : false
        }));
    },

    toggleWorkoutLike: async (workoutId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: existing } = await supabase
            .from('workout_likes')
            .select('*')
            .eq('workout_id', workoutId)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            await supabase.from('workout_likes').delete().eq('id', existing.id);
            const { data: w } = await supabase.from('workout_recordings').select('likes_count').eq('id', workoutId).single();
            await supabase.from('workout_recordings').update({ likes_count: Math.max(0, (w?.likes_count || 0) - 1) }).eq('id', workoutId);
            return false;
        } else {
            await supabase.from('workout_likes').insert({ workout_id: workoutId, user_id: user.id });
            const { data: w } = await supabase.from('workout_recordings').select('likes_count').eq('id', workoutId).single();
            await supabase.from('workout_recordings').update({ likes_count: (w?.likes_count || 0) + 1 }).eq('id', workoutId);
            return true;
        }
    },

    getUserMedals: async () => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return [];

        // Get all medals
        const { data: allMedals, error: mError } = await supabase.from('medals').select('*');
        if (mError) throw mError;

        // Get earned medals
        const { data: earnedMedals, error: eError } = await supabase.from('user_medals').select('medal_id, earned_at').eq('user_id', user.id);
        if (eError) throw eError;

        const earnedIds = new Set(earnedMedals.map(m => m.medal_id));
        const earnedDates = Object.fromEntries(earnedMedals.map(m => [m.medal_id, m.earned_at]));

        return allMedals.map(m => ({
            ...m,
            earned: earnedIds.has(m.id),
            earned_at: earnedDates[m.id]
        }));
    },

    checkAndAwardMedals: async () => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        // Get current stats
        const stats = await api.getUserStats();
        if (!stats) return;

        // Get workout count
        const { count: workoutCount } = await supabase.from('workout_recordings').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

        // Get available medals not yet earned
        const { data: availableMedals } = await supabase.from('medals').select('*');
        const { data: earnedMedals } = await supabase.from('user_medals').select('medal_id').eq('user_id', user.id);
        const earnedIds = new Set(earnedMedals?.map(m => m.medal_id) || []);

        const toAward = availableMedals?.filter(m => !earnedIds.has(m.id)).filter(m => {
            switch (m.requirement_type) {
                case 'points': return stats.points >= m.requirement_value;
                case 'weight_lost': return stats.weightLost >= m.requirement_value;
                case 'days': return stats.day >= m.requirement_value;
                case 'workouts': return (workoutCount || 0) >= m.requirement_value;
                default: return false;
            }
        });

        if (toAward && toAward.length > 0) {
            const inserts = toAward.map(m => ({ user_id: user.id, medal_id: m.id }));
            const { error } = await supabase.from('user_medals').insert(inserts);
            if (!error) {
                toAward.forEach(m => {
                    window.showToast(`🏆 Medalha Ganhada: ${m.name}!`, 'success');
                });
            }
        }
    },

    getNotifications: async () => {
        const { data, error } = await supabase
            .from('app_notifications')
            .select('*')
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    sendNotification: async (title: string, message: string, type: string = 'info') => {
        const { error } = await supabase.from('app_notifications').insert({
            title,
            message,
            type,
            icon: type === 'urgent' ? 'report' : type === 'success' ? 'check_circle' : 'notifications'
        });
        if (error) throw error;
    },

    deleteNotification: async (id: string) => {
        const { error } = await supabase.from('app_notifications').delete().eq('id', id);
        if (error) throw error;
    }
};
