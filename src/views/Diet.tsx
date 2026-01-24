import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Meal } from '../types';

const Diet: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Almoço'); // Default to Almoço
  const [meals, setMeals] = useState<Meal[]>([]);
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: '', description: '', calories: 300, category: 'lunch' });
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [mealImage, setMealImage] = useState<File | null>(null);
  const [mealImagePreview, setMealImagePreview] = useState<string | null>(null);
  const [uploadingMeal, setUploadingMeal] = useState(false);
  const mealInputRef = React.useRef<HTMLInputElement>(null);

  const [userStats, setUserStats] = useState<any>(null);

  const loadData = () => {
    api.getMeals().then(data => {
      if (data) setMeals(data);
    }).catch(console.error);

    api.getShoppingList().then(setShoppingList).catch(console.error);
    api.getUserStats().then(setUserStats).catch(console.error);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleToggleConsumed = async (id: string, currentlyConsumed: boolean) => {
    try {
      const newState = !currentlyConsumed;
      await api.toggleMealConsumed(id, newState);
      loadData();
      if (newState) {
        window.showToast('Refeição registrada! +20 pontos', 'success');
      }
    } catch (err) {
      console.error(err);
      window.showToast('Erro ao atualizar refeição', 'error');
    }
  };

  const handleToggleShopping = async (id: string, currentlyChecked: boolean) => {
    try {
      await api.toggleShoppingItem(id, !currentlyChecked);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShoppingItem.trim()) return;
    try {
      await api.addShoppingItem(newShoppingItem.trim());
      setNewShoppingItem('');
      loadData();
    } catch (err) {
      console.error(err);
      window.showToast('Erro ao adicionar item', 'error');
    }
  };

  const handleDeleteShoppingItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteShoppingItem(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingMeal(true);
    try {
      let imageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'; // Default

      if (mealImage) {
        imageUrl = await api.uploadMealImage(mealImage);
      }

      await api.logMeal({
        ...newMeal,
        image: imageUrl,
        consumed: true,
        time_prep: 'Agora',
        tags: ['Real-time']
      });

      setShowAddModal(false);
      setNewMeal({ name: '', description: '', calories: 300, category: 'lunch' });
      setMealImage(null);
      setMealImagePreview(null);
      loadData();
      window.showToast('Refeição salva e postada no Mural! +20 pontos', 'success');
    } catch (err: any) {
      console.error('Error adding meal:', err);
      // More descriptive error
      const errorMsg = err.message || 'Erro ao salvar refeição';
      window.showToast(errorMsg === 'Failed to fetch' ? 'Erro de conexão ou bucket não criado' : errorMsg, 'error');
    } finally {
      setUploadingMeal(false);
    }
  };

  const estimateCalories = (description: string) => {
    const text = description.toLowerCase();
    let total = 0;

    // Road food calorie dictionary (approximate per portion)
    const library: { [key: string]: number } = {
      'arroz': 130,
      'feijão': 100,
      'feijao': 100,
      'frango': 160,
      'bife': 250,
      'carne': 250,
      'ovo': 80,
      'salada': 30,
      'alface': 10,
      'tomate': 20,
      'batata': 150,
      'pão': 150,
      'pao': 150,
      'queijo': 100,
      'presunto': 50,
      'manteiga': 70,
      'café': 2,
      'leite': 60,
      'suco': 100,
      'refrigerante': 150,
      'macarrão': 200,
      'macarrao': 200,
      'farofa': 150,
      'peixe': 120,
      'fruta': 60,
      'banana': 90,
      'maçã': 60,
      'maca': 60
    };

    Object.keys(library).forEach(item => {
      if (text.includes(item)) {
        total += library[item];
      }
    });

    // Default if nothing found but text exists
    if (total === 0 && text.length > 3) total = 250;
    // Cap for a single meal
    if (total > 1500) total = 1500;

    if (total > 0) {
      setNewMeal(prev => ({ ...prev, calories: total }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMealImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMealImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredMeals = meals.filter(m => {
    const categoryMap: { [key: string]: string } = { 'Café': 'breakfast', 'Almoço': 'lunch', 'Lanches': 'snack', 'Jantar': 'dinner' };
    return m.category === categoryMap[activeTab];
  });

  const caloriesConsumed = meals
    .filter(m => m.consumed)
    .reduce((total, m) => total + (m.calories || 0), 0);

  // Mifflin-St Jeor Equation
  let dailyGoal = 2200;
  if (userStats) {
    const { currentWeight, height, age, gender } = userStats;
    if (currentWeight && height && age) {
      let bmr = (10 * currentWeight) + (6.25 * height) - (5 * age);
      bmr += (gender === 'male' ? 5 : -161);
      // Activity Factor 1.25 (Lightly active/Driving)
      dailyGoal = Math.round(bmr * 1.25);
    }
  }

  const progressPercent = Math.min(100, (caloriesConsumed / dailyGoal) * 100);

  return (
    <div className="flex flex-col animate-in slide-in-from-right duration-500 pb-20">
      <div className="p-4 bg-background-light/95 dark:bg-background-dark/95 sticky top-0 z-20 border-b border-white/10">
        <h2 className="text-xl font-bold text-center">Plano de Alimentação</h2>
        <div className="flex justify-center gap-1.5 mt-4">
          <div className="h-1.5 w-6 rounded-full bg-primary"></div>
          {[...Array(4)].map((_, i) => <div key={i} className="h-1.5 w-1.5 rounded-full bg-surface-highlight"></div>)}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-baseline mb-2">
          <h2 className="text-3xl font-bold">Semana 1: Dia 5</h2>
          <span className="text-primary font-medium text-sm">Fase: Detox</span>
        </div>
        <p className="text-gray-400 text-sm mb-6">Foco: Energia para viagens longas</p>

        {/* Calorie Dashboard */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-6xl">analytics</span>
          </div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Calorias do Dia</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary">{caloriesConsumed}</span>
                <span className="text-sm font-bold text-[var(--text-muted)]">/ {dailyGoal} kcal</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-black px-2 py-1 rounded-md ${progressPercent > 100 ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>

          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-1000 ease-out rounded-full ${progressPercent > 100 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-r from-primary to-[#6eb820] shadow-[0_0_10px_rgba(154,233,48,0.3)]'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <p className="text-[10px] text-[var(--text-muted)] mt-3 font-medium italic">
            {progressPercent > 100 ? '⚠️ Cuidado com o excesso, parceiro!' : '✅ Você está no caminho certo para o objetivo!'}
          </p>
        </div>
      </div>

      <div className="flex gap-3 px-4 overflow-x-auto hide-scrollbar snap-x mb-6">
        {['Café', 'Almoço', 'Lanches', 'Jantar'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`snap-start shrink-0 h-9 px-6 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-sm ${activeTab === tab ? 'bg-primary text-black' : 'bg-[var(--card)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-primary/50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 mb-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-[#6eb820] p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-2 text-background-dark">
            <span className="material-symbols-outlined text-lg bg-white/30 rounded-full p-1">local_shipping</span>
            <h3 className="font-bold text-xs uppercase">Dica de Boleia</h3>
          </div>
          <p className="text-background-dark font-medium leading-snug text-lg">Mantenha água sempre à mão. A hidratação reduz o cansaço visual na estrada.</p>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4 mb-12">
        <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">{activeTab} de Hoje</h3>
        {filteredMeals.map((meal, i) => (
          <div key={i} className={`group flex flex-col gap-4 rounded-2xl bg-[var(--card)] p-4 border transition-all duration-300 ${meal.consumed ? 'border-primary shadow-lg shadow-primary/10' : 'border-[var(--card-border)] shadow-sm hover:shadow-md'}`}>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <img src={meal.image} alt={meal.name} className={`h-full w-full object-cover transition-transform duration-500 ${meal.consumed ? 'grayscale-[0.5] opacity-60' : 'group-hover:scale-105'}`} />
              <div className="absolute bottom-2 left-2 flex gap-1">
                {meal.tags?.map(tag => (
                  <span key={tag} className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md">{tag}</span>
                ))}
              </div>
              {meal.consumed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="bg-primary text-background-dark rounded-full px-4 py-2 font-black text-xs uppercase tracking-widest shadow-xl">Consumido</div>
                </div>
              )}
            </div>
            <div>
              <div className="flex justify-between items-start">
                <h4 className={`text-lg font-black leading-tight ${meal.consumed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>{meal.name}</h4>
                <button
                  onClick={() => handleToggleConsumed(meal.id, meal.consumed)}
                  className={`size-10 rounded-full flex items-center justify-center transition-all shadow-sm transform active:scale-90 ${meal.consumed ? 'bg-primary text-black shadow-primary/20' : 'bg-gray-100 dark:bg-white/5 text-[var(--text-muted)] border border-transparent hover:border-primary/50 hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined text-[24px] font-bold">{meal.consumed ? 'check' : 'radio_button_unchecked'}</span>
                </button>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">{meal.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--card-border)] pt-3">
                <div className="flex gap-3 text-xs text-[var(--text-muted)] font-bold">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] font-bold">timer</span> {meal.time_prep}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] font-bold text-primary">local_fire_department</span> {meal.calories} kcal</span>
                </div>
                {!meal.consumed && <span className="text-primary text-[10px] font-black tracking-widest">+20 PTS</span>}
              </div>
            </div>
          </div>
        ))}
        {filteredMeals.length === 0 && (
          <div className="text-center py-10 opacity-50 bg-card-dark rounded-2xl border border-dashed border-white/10">
            <span className="material-symbols-outlined text-5xl mb-2 text-gray-600">restaurant_menu</span>
            <p>Nenhuma refeição registrada.</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-40">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Lista de Compras</h3>
          <span className="bg-primary/20 text-primary text-[10px] uppercase font-black px-2 py-0.5 rounded-full">Provisões</span>
        </div>

        <form onSubmit={handleAddShoppingItem} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newShoppingItem}
            onChange={(e) => setNewShoppingItem(e.target.value)}
            placeholder="Adicionar item (ex: Banana, Aveia)"
            className="flex-1 bg-[var(--card)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-primary transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!newShoppingItem.trim()}
            className="bg-primary text-background-dark size-11 rounded-xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </form>

        <div className="rounded-2xl bg-[var(--card)] border border-[var(--card-border)] p-2 flex flex-col gap-1 shadow-md mb-8">
          {shoppingList.map(item => (
            <ShoppingItem
              key={item.id}
              label={item.label}
              checked={item.checked}
              onToggle={() => handleToggleShopping(item.id, item.checked)}
              onDelete={(e) => handleDeleteShoppingItem(e, item.id)}
            />
          ))}
          {shoppingList.length === 0 && (
            <div className="text-center py-8 opacity-30">
              <span className="material-symbols-outlined text-4xl mb-2">shopping_basket</span>
              <p className="text-sm font-medium">Sua lista está vazia</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-40">
        <button
          onClick={() => setShowAddModal(true)}
          className="shadow-lg shadow-primary/30 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-black font-bold py-4 px-8 rounded-full w-full max-w-sm transition-all transform active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="text-lg">Registrar Refeição</span>
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-background-light dark:bg-card-dark w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl relative z-10 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-2 flex justify-between items-center border-b border-white/5">
              <h3 className="text-xl font-bold">O que você comeu?</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              <form id="mealForm" onSubmit={handleAddMeal} className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-3">
                  <div
                    onClick={() => mealInputRef.current?.click()}
                    className="w-full aspect-video rounded-2xl bg-[var(--background)] border-2 border-dashed border-[var(--card-border)] flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-all relative group"
                  >
                    {mealImagePreview ? (
                      <>
                        <img src={mealImagePreview} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-4xl text-[var(--text-muted)] group-hover:text-primary transition-colors">add_a_photo</span>
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-2">Clique para bater a foto</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={mealInputRef}
                    onChange={handleImageChange}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Nome da Refeição</label>
                    <input
                      required
                      type="text"
                      value={newMeal.name}
                      onChange={e => setNewMeal({ ...newMeal, name: e.target.value })}
                      className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3.5 outline-none focus:border-primary transition-colors text-[var(--text-primary)] font-bold"
                      placeholder="Ex: Prato Feito de Posto"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Descrição / Notas</label>
                    <textarea
                      value={newMeal.description}
                      onChange={e => {
                        const val = e.target.value;
                        setNewMeal({ ...newMeal, description: val });
                        estimateCalories(val);
                      }}
                      className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3.5 outline-none focus:border-primary transition-colors h-24 text-[var(--text-primary)] font-bold resize-none"
                      placeholder="Ex: Arroz, feijão, frango grelhado e salada."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Tamanho da Refeição</label>
                      <select
                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3.5 outline-none focus:border-primary transition-colors font-bold text-[var(--text-primary)] appearance-none mb-4"
                        onChange={(e) => {
                          const val = e.target.value;
                          let est = 0;
                          if (val === 'leve') est = 350;
                          if (val === 'media') est = 650;
                          if (val === 'pesada') est = 900;
                          if (val === 'rodizio') est = 1500;
                          if (est > 0) setNewMeal({ ...newMeal, calories: est });
                        }}
                      >
                        <option value="">Selecione para estimar...</option>
                        <option value="leve">Leve (Salada, Fruta, Lanche Natural)</option>
                        <option value="media">Média (PF, Marmita Padrão)</option>
                        <option value="pesada">Pesada (Feijoada, Macarrão, Hambúrguer)</option>
                        <option value="rodizio">Churrasco / Rodízio</option>
                      </select>

                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Calorias (aprox)</label>
                      <input
                        type="number"
                        value={newMeal.calories}
                        onChange={e => setNewMeal({ ...newMeal, calories: parseInt(e.target.value) })}
                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3.5 outline-none focus:border-primary transition-colors font-bold text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Momento</label>
                      <div className="relative">
                        <select
                          value={newMeal.category}
                          onChange={e => setNewMeal({ ...newMeal, category: e.target.value as any })}
                          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3.5 outline-none focus:border-primary transition-colors font-bold text-[var(--text-primary)] appearance-none"
                        >
                          <option value="breakfast">Café</option>
                          <option value="lunch">Almoço</option>
                          <option value="snack">Lanches</option>
                          <option value="dinner">Jantar</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-background-light/50 dark:bg-card-dark/50 backdrop-blur-sm rounded-b-3xl">
              <button
                form="mealForm"
                type="submit"
                disabled={uploadingMeal}
                className="bg-primary text-black font-black py-4 rounded-xl w-full active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingMeal ? (
                  <>
                    <div className="size-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span className="uppercase tracking-widest text-xs">Postando no Mural...</span>
                  </>
                ) : (
                  <span className="uppercase tracking-widest text-xs">Salvar Refeição +20 PTS</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-full text-[var(--text-muted)] font-black text-xs uppercase tracking-widest py-3 mt-2 hover:text-[var(--text-primary)] transition-colors"
                disabled={uploadingMeal}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShoppingItem: React.FC<{ label: string; checked?: boolean; onToggle: () => void; onDelete: (e: React.MouseEvent) => void }> = ({ label, checked, onToggle, onDelete }) => (
  <div
    className="group flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
    onClick={onToggle}
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${checked ? 'bg-primary border-primary scale-110' : 'border-white/10 bg-black/20 group-hover:border-primary/50'}`}>
        {checked && <span className="material-symbols-outlined text-[16px] text-background-dark font-black">check</span>}
      </div>
      <span className={`text-sm font-bold transition-all truncate ${checked ? 'text-gray-500 line-through italic' : 'text-slate-200'}`}>{label}</span>
    </div>
    <button
      onClick={onDelete}
      className="size-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
    >
      <span className="material-symbols-outlined text-lg">delete</span>
    </button>
  </div>
);

export default Diet;
