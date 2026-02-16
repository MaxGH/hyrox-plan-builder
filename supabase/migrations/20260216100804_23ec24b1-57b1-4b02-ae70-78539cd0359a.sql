create policy "Users can update own plan"
  on training_plans for update
  using (auth.uid() = user_id);