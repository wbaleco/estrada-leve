import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

const Resources: React.FC = () => {
  const [activeCat, setActiveCat] = useState('Tudo');
  const [resources, setResources] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    image: '',
    category: 'Nutrição',
    type: 'article' as 'article' | 'video',
    url: '',
    content: ''
  });
  const [articleMode, setArticleMode] = useState<'upload' | 'write'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingArticle, setViewingArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

  const loadResources = () => {
    api.getResources(activeCat).then(setResources).catch(console.error);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
    loadResources();
  }, [activeCat]);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalUrl = newResource.url;

      // Handle PDF upload
      if (newResource.type === 'article' && articleMode === 'upload' && selectedFile) {
        finalUrl = await api.uploadResourceFile(selectedFile);
      }

      await api.addResource({
        ...newResource,
        url: finalUrl,
        content: articleMode === 'write' ? newResource.content : undefined
      });

      window.showToast('Recurso cadastrado com sucesso!', 'success');
      setShowAddModal(false);
      setNewResource({
        title: '',
        description: '',
        image: '',
        category: 'Nutrição',
        type: 'article',
        url: '',
        content: ''
      });
      setSelectedFile(null);
      loadResources();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || 'Erro ao cadastrar recurso';
      window.showToast(`Erro: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    setLoading(true);

    const updates = {
      title: editingResource.title,
      description: editingResource.description,
      image: editingResource.image,
      category: editingResource.category,
      url: editingResource.url,
      content: editingResource.content
    };

    try {
      await api.updateResource(editingResource.id, updates);
      window.showToast('Recurso atualizado!', 'success');
      setShowEditModal(false);

      // Optimistically update the UI
      setResources(prev => {
        // If a filter is active and the category changed to something else, remove it
        if (activeCat !== 'Tudo' && updates.category !== activeCat) {
          return prev.filter(r => r.id !== editingResource.id);
        }
        // Otherwise update the item in place
        return prev.map(r => r.id === editingResource.id ? { ...r, ...updates } : r);
      });

      setEditingResource(null);
      // Removed loadResources() to prevent overwriting optimistic update with potentially stale data from server
    } catch (err) {
      console.error(err);
      window.showToast('Erro ao atualizar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;
    try {
      await api.deleteResource(resourceToDelete);
      window.showToast('Recurso excluído!', 'success');
      setResourceToDelete(null);
      loadResources();
    } catch (err) {
      console.error(err);
      window.showToast('Erro ao excluir', 'error');
    }
  };

  return (
    <div className="flex flex-col animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="p-4 bg-[var(--background)]/95 backdrop-blur-sm sticky top-0 z-20 border-b border-[var(--card-border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recursos do Motorista</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-background-dark px-3 py-2 rounded-lg text-[10px] font-black flex items-center gap-1 active:scale-95 transition-all shadow-lg shadow-primary/20 uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Contribuir (+100 pts)
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar">
          {['Tudo', 'Nutrição', 'Sono', 'Movimento', 'Mente'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeCat === cat ? 'bg-primary text-black' : 'bg-input-dark text-text-muted border border-white/5'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">article</span>
          Artigos & Dicas
        </h3>
        <div className="flex flex-col gap-6 mb-8">
          {resources.filter(r => r.type === 'article').map(r => (
            <div key={r.id} className="bg-[var(--card)] rounded-2xl shadow-sm overflow-hidden border border-[var(--card-border)] group transition-all duration-300 hover:shadow-xl hover:border-primary/20 relative">

              {/* Owner Controls */}
              {currentUserId === r.user_id && (
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingResource(r); setShowEditModal(true); }}
                    className="size-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setResourceToDelete(r.id); }}
                    className="size-8 rounded-full bg-red-500/50 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                  </button>
                </div>
              )}

              <div
                className="h-40 bg-cover bg-center transition-transform group-hover:scale-105 duration-500"
                style={{ backgroundImage: `url('${r.image || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=200&fit=crop"}')` }}
              />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{r.category}</span>
                </div>
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-2 group-hover:text-primary transition-colors leading-tight">{r.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-2 font-medium">{r.description}</p>
                {r.content ? (
                  <button
                    onClick={() => setViewingArticle(r)}
                    className="w-full bg-primary text-background-dark font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-all"
                  >
                    Ler Artigo Completo
                  </button>
                ) : (
                  <button
                    onClick={() => r.url && window.open(r.url, '_blank')}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[var(--text-primary)] font-black py-2.5 rounded-xl hover:bg-primary hover:text-black hover:border-primary transition-all uppercase text-xs tracking-widest"
                  >
                    {r.url?.endsWith('.pdf') ? 'Abrir PDF' : 'Ler Artigo'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">play_circle</span>
          Vídeos e Aulas
        </h3>
        <div className="flex flex-col gap-3 pb-8">
          {resources.filter(r => r.type === 'video').map(r => (
            <ResourceCard
              key={r.id}
              resource={r}
              isOwner={currentUserId === r.user_id}
              onEdit={() => { setEditingResource(r); setShowEditModal(true); }}
              onDelete={() => setResourceToDelete(r.id)}
            />
          ))}
          {resources.length === 0 && (
            <div className="text-center py-20 opacity-30">
              <span className="material-symbols-outlined text-5xl mb-2">auto_stories</span>
              <p className="text-sm font-black">Nenhum recurso encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-background-dark w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 relative z-10 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              Novo Recurso
            </h3>
            <form onSubmit={handleAddResource} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo de Recurso</label>
                  <select
                    value={newResource.type}
                    onChange={e => setNewResource({ ...newResource, type: e.target.value as any })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm text-[var(--text-primary)] appearance-none font-bold"
                  >
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="article">Artigo / PDF</option>
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="video">Vídeo Aula</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                  <select
                    value={newResource.category}
                    onChange={e => setNewResource({ ...newResource, category: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm text-[var(--text-primary)] appearance-none font-bold"
                  >
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="Nutrição">Nutrição</option>
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="Sono">Sono</option>
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="Movimento">Movimento</option>
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="Mente">Mente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título</label>
                <input
                  required
                  type="text"
                  value={newResource.title}
                  onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm"
                  placeholder="Ex: 5 Alongamentos para Fazer na Cabine"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição Curta</label>
                <textarea
                  required
                  value={newResource.description}
                  onChange={e => setNewResource({ ...newResource, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors h-20 text-sm resize-none"
                  placeholder="Explique brevemente o conteúdo para o card..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">URL da Imagem de Capa (opcional)</label>
                <input
                  type="url"
                  value={newResource.image}
                  onChange={e => setNewResource({ ...newResource, image: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm"
                  placeholder="https://exemplo.com/imagem.png"
                />
              </div>

              {newResource.type === 'video' ? (
                <div>
                  <label className="text-xs font-bold text-primary uppercase mb-1 block">Link do Vídeo (YouTube)</label>
                  <input
                    required
                    type="url"
                    value={newResource.url}
                    onChange={e => setNewResource({ ...newResource, url: e.target.value })}
                    className="w-full bg-white/5 border border-primary/30 rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              ) : (
                <>
                  <div className="pt-2">
                    <label className="text-xs font-bold text-primary uppercase mb-2 block">Formato do Artigo</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setArticleMode('upload')}
                        className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all border ${articleMode === 'upload' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                      >
                        Carregar PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setArticleMode('write')}
                        className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all border ${articleMode === 'write' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                      >
                        Escrever Texto
                      </button>
                    </div>
                  </div>

                  {articleMode === 'upload' ? (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Arquivo PDF</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-xs text-gray-400"
                      />
                      {selectedFile && (
                        <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          {selectedFile.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Conteúdo do Artigo</label>
                      <textarea
                        required
                        value={newResource.content}
                        onChange={e => setNewResource({ ...newResource, content: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors h-48 text-sm resize-none custom-scrollbar"
                        placeholder="Escreva seu artigo aqui..."
                      />
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? 'Cadastrando...' : 'Salvar'}
                </button>
              </div>
              <div className="h-6"></div> {/* Bottom spacer */}
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingResource && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowEditModal(false)}></div>
          <div className="bg-background-dark w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 relative z-10 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit</span>
              Editar Recurso
            </h3>
            <form onSubmit={handleUpdateResource} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                  <select
                    value={editingResource.category}
                    onChange={e => setEditingResource({ ...editingResource, category: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm text-[var(--text-primary)] appearance-none font-bold"
                  >
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="Nutrição">Nutrição</option>
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="Sono">Sono</option>
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="Movimento">Movimento</option>
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="Mente">Mente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título</label>
                <input
                  required
                  type="text"
                  value={editingResource.title}
                  onChange={e => setEditingResource({ ...editingResource, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição Curta</label>
                <textarea
                  required
                  value={editingResource.description}
                  onChange={e => setEditingResource({ ...editingResource, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors h-20 text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">URL da Imagem</label>
                <input
                  type="url"
                  value={editingResource.image}
                  onChange={e => setEditingResource({ ...editingResource, image: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              {editingResource.type === 'video' ? (
                <div>
                  <label className="text-xs font-bold text-primary uppercase mb-1 block">Link do Vídeo</label>
                  <input
                    required
                    type="url"
                    value={editingResource.url}
                    onChange={e => setEditingResource({ ...editingResource, url: e.target.value })}
                    className="w-full bg-white/5 border border-primary/30 rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              ) : (
                editingResource.content && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Conteúdo</label>
                    <textarea
                      required
                      value={editingResource.content}
                      onChange={e => setEditingResource({ ...editingResource, content: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors h-48 text-sm resize-none custom-scrollbar"
                    />
                  </div>
                )
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Atualizar'}
                </button>
              </div>
              <div className="h-6"></div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {resourceToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--card)] w-full max-w-sm rounded-[24px] border border-[var(--card-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500">
                <span className="material-symbols-outlined text-3xl">delete</span>
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Excluir Recurso?</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Essa ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setResourceToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-[var(--text-primary)] hover:bg-white/5 transition-colors border border-[var(--card-border)]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteResource}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingArticle && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setViewingArticle(null)}></div>
          <div className="bg-[var(--background)] w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden relative z-10 border border-[var(--card-border)] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="h-48 bg-cover bg-center shrink-0 relative" style={{ backgroundImage: `url('${viewingArticle.image || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=200&fit=crop"}')` }}>
              <button
                onClick={() => setViewingArticle(null)}
                className="absolute top-4 right-4 size-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="absolute bottom-4 left-4">
                <span className="bg-primary text-background-dark text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider shadow-lg">
                  {viewingArticle.category}
                </span>
              </div>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <h2 className="text-2xl font-black mb-4 leading-tight text-[var(--text-primary)] uppercase tracking-tight">{viewingArticle.title}</h2>
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {viewingArticle.content}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-[var(--card-border)] bg-gray-50 dark:bg-white/5">
              <button
                onClick={() => setViewingArticle(null)}
                className="w-full bg-primary text-black font-black py-3 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
              >
                FECHAR LEITURA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ResourceCardProps {
  resource: any;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isOwner, onEdit, onDelete }) => (
  <div
    onClick={() => resource.url && window.open(resource.url, '_blank')}
    className="flex items-center p-3 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm active:scale-[0.98] transition-all duration-300 cursor-pointer group hover:border-primary/40 hover:shadow-md relative"
  >
    {isOwner && (
      <div className="absolute top-1 right-1 z-10 flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="size-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <span className="material-symbols-outlined text-[10px]">edit</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="size-6 rounded-full bg-red-500/50 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <span className="material-symbols-outlined text-[10px]">delete</span>
        </button>
      </div>
    )}

    <div className="size-16 rounded-xl overflow-hidden shrink-0 border border-[var(--card-border)] shadow-inner">
      <img src={resource.image || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100&h=100&fit=crop"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={resource.title} />
    </div>
    <div className="ml-4 flex-1 min-w-0">
      <h4 className="font-black text-sm text-[var(--text-primary)] leading-tight group-hover:text-primary transition-colors truncate uppercase tracking-tight">{resource.title}</h4>
      <p className="text-[var(--text-muted)] text-[10px] mt-1 line-clamp-2 font-medium tracking-tight leading-relaxed">{resource.description}</p>
    </div>
    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all border border-primary/20">
      <span className="material-symbols-outlined font-black text-xl">play_arrow</span>
    </div>
  </div>
);

export default Resources;
