
import React from 'react';
import { Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

import { api } from '../lib/api';
import { UserStats } from '../types';

const Goals: React.FC = () => {
  const [history, setHistory] = React.useState<any[]>([]);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<UserStats | null>(null);
  const [showWeightModal, setShowWeightModal] = React.useState(false);
  const [newWeight, setNewWeight] = React.useState('');
  const [newWaist, setNewWaist] = React.useState('');
  const [postText, setPostText] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);

  const loadData = () => {
    api.getWeightHistory().then(setHistory).catch(console.error);
    api.getSocialPosts().then(setPosts).catch(console.error);
    api.getUserStats().then(setStats).catch(console.error);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleUpdateWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    try {
      await api.updateWeight(parseFloat(newWeight), newWaist ? parseFloat(newWaist) : undefined);
      setShowWeightModal(false);
      setNewWeight('');
      setNewWaist('');
      loadData();
      window.showToast('Registros salvos com sucesso! +20 pontos', 'success');
    } catch (err) {
      console.error(err);
      window.showToast('Erro ao registrar peso', 'error');
    }
  };

  const handleSendPost = async () => {
    if (!postText.trim()) return;
    setIsPosting(true);
    try {
      await api.addSocialPost(postText.trim());
      setPostText('');
      loadData();
      window.showToast('Mensagem enviada! +10 pontos', 'success');
    } catch (err) {
      console.error(err);
      window.showToast('Erro ao enviar mensagem', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-col p-4 animate-in fade-in duration-500 pb-40">
      <h1 className="text-2xl font-bold tracking-tight mb-1 text-[var(--text-primary)]">Foco na estrada e <span className="text-primary">na balança!</span></h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Sua jornada está incrível. Continue firme.</p>

      {/* Hero Stats */}
      <div className="bg-gradient-to-br from-primary/10 to-transparent dark:from-[#364922] dark:to-[#253218] border border-primary/20 dark:border-[#4d6831] rounded-2xl p-6 shadow-lg mb-4 relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="material-symbols-outlined text-8xl text-primary">scale</span>
        </div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-[var(--text-secondary)] text-sm mb-1 uppercase font-bold tracking-wider">Peso Atual</p>
            <p className="text-4xl font-black text-[var(--text-primary)]">{stats?.currentWeight || '-'} <span className="text-xl text-primary font-bold">kg</span></p>
          </div>
          <div className="text-right">
            <p className="text-[var(--text-secondary)] text-[10px] mb-1 uppercase font-bold tracking-wider">Barriga</p>
            <p className="text-xl font-black text-[var(--text-primary)]">{stats?.waistCm || '-'} <span className="text-xs text-primary font-bold">cm</span></p>
          </div>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-4">Última atualização: Hoje, {(new Date()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <span className="material-symbols-outlined text-sm">flag</span>
            <span className="text-xs uppercase font-bold tracking-wider">Início</span>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)]">{stats?.startWeight || '-'} kg</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-1">
            <span className="material-symbols-outlined text-sm font-bold">emoji_events</span>
            <span className="text-xs uppercase font-bold tracking-wider">Meta</span>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)]">{stats?.goalWeight || '-'} kg</p>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 text-[var(--text-primary)]">
          <h3 className="font-bold">Evolução de Peso</h3>
          <div className="flex bg-gray-100 dark:bg-background-dark rounded-full p-1">
            <button className="px-3 py-1 text-[10px] font-bold bg-primary text-black rounded-full shadow-sm">Mês</button>
            <button className="px-3 py-1 text-[10px] font-bold text-[var(--text-secondary)]">Ano</button>
          </div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8cf425" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8cf425" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#8cf425', fontWeight: 'bold' }}
                labelStyle={{ color: 'var(--text-secondary)', fontSize: '10px', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="weight" stroke="#8cf425" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={3} animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Social Feed */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Amigos na Estrada</h3>
        <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">Apoio Mútuo</span>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 mb-6 shadow-xl">
        <div className="flex gap-3">
          <div
            className="size-10 rounded-full bg-cover bg-center border-2 border-primary shrink-0"
            style={{ backgroundImage: `url('${stats?.avatarUrl || "https://lh3.googleusercontent.com/..."}')` }}
          />
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Como está o foco hoje, parceiro?"
              className="bg-gray-50 dark:bg-white/5 border border-[var(--card-border)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-primary transition-all resize-none min-h-[80px]"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSendPost}
                disabled={!postText.trim() || isPosting}
                className="bg-primary text-background-dark font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-50 active:scale-95 transition-all flex items-center gap-2"
              >
                {isPosting ? 'Enviando...' : 'Postar'}
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 pb-8">
        {posts.map((post) => (
          <SocialPost
            key={post.id}
            id={post.id}
            name={post.name}
            text={post.text}
            time={post.time_ago}
            color={post.color}
            stats={post.stats}
            avatarUrl={post.user_avatar_url}
            likes_count={post.likes_count}
            comments_count={post.comments_count}
            is_liked={post.is_liked}
            onRefresh={loadData}
          />
        ))}
      </div>

      <div className="fixed bottom-24 left-0 right-0 z-30 pointer-events-none px-4 flex justify-center">
        <button
          onClick={() => setShowWeightModal(true)}
          className="pointer-events-auto w-full max-w-sm bg-primary hover:bg-primary-dark text-background-dark font-bold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add</span>
          Registrar Peso
        </button>
      </div>

      {showWeightModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowWeightModal(false)}></div>
          <div className="bg-background-light dark:bg-card-dark w-full max-w-md rounded-3xl p-6 relative z-10 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Novo Registro</h3>
              <button
                onClick={() => setShowWeightModal(false)}
                className="size-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-white/5 transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateWeight} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Peso Atual (kg)</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-bold text-center outline-none focus:border-primary transition-colors mb-4"
                  placeholder="0.0"
                />

                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Medida da Barriga (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newWaist}
                  onChange={e => setNewWaist(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-bold text-center outline-none focus:border-primary transition-colors"
                  placeholder="0.0"
                />
              </div>
              <p className="text-xs text-gray-400 text-center">Quanto mais frequente você registrar, melhor será o seu gráfico de evolução!</p>
              <button type="submit" className="bg-primary text-black font-bold py-4 rounded-xl mt-4 active:scale-95 transition-transform text-lg">
                Salvar Peso
              </button>
              <button
                type="button"
                onClick={() => setShowWeightModal(false)}
                className="text-gray-500 text-sm font-bold uppercase tracking-wider py-2"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SocialPost: React.FC<{
  id: string;
  name: string;
  text: string;
  time: string;
  color: string;
  stats?: string;
  avatarUrl?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  onRefresh: () => void;
}> = ({ id, name, text, time, color, stats, avatarUrl, likes_count, comments_count, is_liked, onRefresh }) => {
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [isLiking, setIsLiking] = React.useState(false);
  const [isCommenting, setIsCommenting] = React.useState(false);

  const loadComments = async () => {
    try {
      const data = await api.getComments(id);
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState) loadComments();
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await api.toggleLike(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      await api.addComment(id, newComment);
      setNewComment('');
      loadComments();
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-all duration-300">
      <div className="flex gap-3">
        {avatarUrl ? (
          <div className="size-12 rounded-full bg-cover bg-center border border-primary/20 shadow-sm shrink-0" style={{ backgroundImage: `url('${avatarUrl}')` }} />
        ) : (
          <div className={`size-12 rounded-full bg-${color}-500/20 text-${color}-600 dark:text-${color}-400 border border-${color}-500/30 flex items-center justify-center font-black text-sm uppercase shrink-0`}>
            {name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-black text-[var(--text-primary)] truncate">{name}</p>
            <span className="text-[10px] text-[var(--text-muted)] font-medium whitespace-nowrap">{time}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-normal break-words">
            {stats && <span className="font-black text-primary mr-1">[{stats}]</span>} {text}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black transition-all active:scale-95 ${is_liked ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-gray-100 dark:bg-white/5 text-[var(--text-secondary)] hover:text-primary hover:bg-primary/10 border border-transparent'}`}
            >
              <span className="material-symbols-outlined text-sm">{is_liked ? 'thumb_up' : 'thumb_up'}</span>
              {likes_count > 0 ? likes_count : ''} Curtir
            </button>
            <button
              onClick={toggleComments}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black transition-all active:scale-95 ${showComments ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-gray-100 dark:bg-white/5 text-[var(--text-secondary)] hover:text-primary hover:bg-primary/10 border border-transparent'}`}
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              {comments_count > 0 ? comments_count : ''} Comentar
            </button>
          </div>

          {/* Comment Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col gap-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="size-6 rounded-full bg-cover bg-center shrink-0 border border-white/10" style={{ backgroundImage: `url('${comment.user_avatar_url || "https://lh3.googleusercontent.com/..."}')` }} />
                    <div className="flex-1 bg-white/5 rounded-xl p-3">
                      <p className="text-[11px] font-bold text-primary mb-1">{comment.user_name}</p>
                      <p className="text-[11px] text-gray-300">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="w-full bg-black/20 border border-white/10 rounded-full px-4 py-2 text-xs text-white outline-none focus:border-primary pr-10"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isCommenting}
                  className="absolute right-2 top-1.5 text-primary disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Goals;
