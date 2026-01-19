
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas!');
    console.error('Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local');
    console.error('Exemplo: copie .env.example para .env.local e preencha com suas credenciais do Supabase');
}

if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
    console.warn('⚠️ AVISO: A URL do Supabase parece estar incorreta. Deve ser algo como: https://seu-projeto.supabase.co');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
