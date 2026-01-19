
-- Create a new bucket for meal images
insert into storage.buckets (id, name, public)
values ('meals', 'meals', true)
on conflict (id) do nothing;

-- Set up storage policies for meals bucket
create policy "Meal images are public"
on storage.objects for select
using ( bucket_id = 'meals' );

create policy "Authenticated users can upload meal images"
on storage.objects for insert
with check (
  bucket_id = 'meals' 
  and auth.role() = 'authenticated'
);

create policy "Users can delete their own meal images"
on storage.objects for delete
using (
  bucket_id = 'meals'
  and auth.uid() = (storage.foldername(name))[1]::uuid
);
