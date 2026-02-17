
-- Enable RLS on events and event_types tables (pre-existing issue)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

-- Public read access for events (race reference data)
CREATE POLICY "Events are publicly readable"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Event types are publicly readable"
  ON public.event_types FOR SELECT
  USING (true);
