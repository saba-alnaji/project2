
-- Books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  barcode TEXT UNIQUE,
  classification_code TEXT,
  serial_number TEXT,
  height TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on books" ON public.books FOR ALL USING (true) WITH CHECK (true);

-- Loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id),
  book_id UUID NOT NULL REFERENCES public.books(id),
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  actual_return_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  book_condition TEXT DEFAULT 'good',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on loans" ON public.loans FOR ALL USING (true) WITH CHECK (true);

-- Fines table
CREATE TABLE public.fines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES public.loans(id),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id),
  fine_type TEXT NOT NULL DEFAULT 'late_return',
  amount NUMERIC NOT NULL DEFAULT 0,
  book_title TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on fines" ON public.fines FOR ALL USING (true) WITH CHECK (true);

-- Loan requests (online)
CREATE TABLE public.loan_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id),
  book_title TEXT NOT NULL,
  classification_code TEXT,
  book_height TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on loan_requests" ON public.loan_requests FOR ALL USING (true) WITH CHECK (true);

-- Subscription requests (online)
CREATE TABLE public.subscription_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_name TEXT NOT NULL,
  phone_number TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on subscription_requests" ON public.subscription_requests FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
