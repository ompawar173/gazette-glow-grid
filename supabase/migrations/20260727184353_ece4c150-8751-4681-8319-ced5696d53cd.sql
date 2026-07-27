
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto-promote first signup to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "cat_admin_write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- Articles
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subcategory TEXT,
  author_name TEXT NOT NULL DEFAULT 'Editorial Team',
  author_title TEXT,
  excerpt TEXT,
  body TEXT NOT NULL DEFAULT '',
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT ALL ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "art_public_read_pub" ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "art_admin_read_all" ON public.articles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "art_admin_write" ON public.articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE INDEX articles_category_idx ON public.articles(category);
CREATE INDEX articles_status_idx ON public.articles(status);

-- Increment view count RPC (bypasses RLS for update)
CREATE OR REPLACE FUNCTION public.increment_article_views(_slug TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.articles SET view_count = view_count + 1 WHERE slug = _slug AND status = 'published';
END; $$;
GRANT EXECUTE ON FUNCTION public.increment_article_views(TEXT) TO anon, authenticated;

-- Magazines
CREATE TABLE public.magazines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  cover_image_url TEXT,
  pdf_file_url TEXT,
  issue_month TEXT,
  issue_year INT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.magazines TO anon, authenticated;
GRANT ALL ON public.magazines TO authenticated;
GRANT ALL ON public.magazines TO service_role;
ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mag_public_read_pub" ON public.magazines FOR SELECT USING (status = 'published');
CREATE POLICY "mag_admin_read_all" ON public.magazines FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "mag_admin_write" ON public.magazines FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_public_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "sub_admin_read" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "sub_admin_delete" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Activity log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "log_admin_read" ON public.activity_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "log_admin_insert" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- Seed categories
INSERT INTO public.categories (name, slug) VALUES
  ('CEO Insights', 'ceo-insights'),
  ('CIO Insights', 'cio-insights'),
  ('AI & Analytics', 'ai-analytics'),
  ('Cloud & Infrastructure', 'cloud-infrastructure'),
  ('Cybersecurity', 'cybersecurity');

-- Seed articles (18)
INSERT INTO public.articles (title, slug, category, author_name, author_title, excerpt, body, featured_image_url, status, published_at) VALUES
('How Enterprise CEOs Are Rewriting the AI Playbook', 'ceos-rewriting-ai-playbook', 'CEO Insights', 'Margaret Chen', 'Contributing Editor', 'Fortune 500 chief executives are moving from AI experimentation to enterprise-wide transformation, with measurable ROI now the north star.', '<p>As artificial intelligence matures from proof-of-concept to production, CEOs across industries are recalibrating their strategies. In boardrooms from New York to Singapore, the conversation has shifted from "should we invest in AI" to "how quickly can we scale it responsibly."</p><h2>The New Executive Mandate</h2><p>According to a recent survey of 400 global CEOs, 78% now consider AI a top-three strategic priority, up from just 34% two years ago. The shift is driven by early adopters demonstrating clear competitive advantages in efficiency, customer engagement, and product innovation.</p><p>"We stopped treating AI as an IT initiative and started treating it as a core business transformation," says one Fortune 100 CEO. "That distinction changed everything about how we allocate capital and talent."</p><h2>Measuring What Matters</h2><p>Leaders are moving beyond vanity metrics toward hard business outcomes: reduced cycle times, improved margins, and net new revenue streams. Governance frameworks and cross-functional AI councils have become standard practice.</p>', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800', 'published', now() - interval '1 day'),
('CIO Priorities for the Next Fiscal Year: Beyond Cost Cutting', 'cio-priorities-next-fiscal-year', 'CIO Insights', 'David Whitmore', 'Senior Analyst', 'Chief Information Officers are shifting budgets from maintenance to modernization, with platform engineering and data fabric leading the way.', '<p>The role of the CIO has fundamentally changed. No longer purely a cost center, IT is now expected to deliver measurable business value while managing an increasingly complex technology estate.</p><p>Top priorities emerging from recent CIO advisory boards include platform engineering, data fabric architectures, zero-trust security, and workforce enablement through generative AI copilots.</p><h2>The Modernization Imperative</h2><p>Legacy modernization is no longer optional. CIOs are systematically retiring technical debt while embedding cloud-native patterns across the estate.</p>', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', 'published', now() - interval '2 days'),
('The Generative AI Reality Check: Separating Hype from Enterprise Value', 'generative-ai-reality-check', 'AI & Analytics', 'Priya Ramanathan', 'Technology Correspondent', 'After 24 months of pilots, enterprises are settling on a narrow set of use cases that consistently deliver ROI.', '<p>Enterprise generative AI has entered its post-hype phase. Successful deployments cluster around three areas: knowledge management, customer service augmentation, and software development acceleration.</p><h2>What Works</h2><p>Companies reporting the strongest returns share three traits: clean underlying data, disciplined evaluation frameworks, and executive sponsorship at the C-suite level.</p>', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', 'published', now() - interval '3 days'),
('Multi-Cloud Strategies: Why FinOps Now Sits at the CIO Table', 'multi-cloud-finops-cio-table', 'Cloud & Infrastructure', 'Marcus Doyle', 'Cloud Editor', 'As cloud bills balloon, financial operations discipline has become as important as the underlying architecture decisions.', '<p>Cloud spending will exceed $700 billion globally this year, and CIOs are under pressure to justify every dollar. FinOps — the practice of bringing financial accountability to cloud consumption — has moved from niche to mainstream.</p><p>Leading organizations are embedding FinOps engineers directly into product teams, giving developers real-time visibility into the cost implications of their architectural choices.</p>', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800', 'published', now() - interval '4 days'),
('Zero Trust Isn''t a Product — It''s a Journey Most Companies Haven''t Finished', 'zero-trust-journey-not-finished', 'Cybersecurity', 'Elena Vasquez', 'Security Editor', 'Two years after the White House executive order, most enterprises are still in early phases of zero-trust adoption.', '<p>The zero-trust security model has been widely embraced in principle, but implementation remains uneven. Recent surveys suggest that fewer than 25% of large enterprises have fully deployed zero-trust architectures across their environments.</p><h2>The Roadblocks</h2><p>Legacy systems, cultural resistance, and identity governance gaps are the most cited barriers. Successful programs treat zero trust as a multi-year architectural transformation, not a product purchase.</p>', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800', 'published', now() - interval '5 days'),
('Ransomware in 2026: Why Small Wins by Defenders Are Turning the Tide', 'ransomware-2026-defenders-turning-tide', 'Cybersecurity', 'Elena Vasquez', 'Security Editor', 'Coordinated law enforcement action, cyber insurance discipline, and better backups are finally hurting ransomware economics.', '<p>For the first time in five years, average ransom payments have declined year-over-year. Analysts credit a combination of factors: takedowns of major ransomware-as-a-service operators, tighter insurance underwriting, and dramatically improved backup practices.</p>', 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800', 'published', now() - interval '6 days'),
('Data Fabric vs Data Mesh: The Debate That Won''t Die', 'data-fabric-vs-mesh-debate', 'AI & Analytics', 'Priya Ramanathan', 'Technology Correspondent', 'Both architectural patterns promise to solve enterprise data chaos. The truth is most large organizations end up blending them.', '<p>The industry debate between data fabric and data mesh has generated countless conference sessions and vendor pitches. In practice, most large enterprises are quietly adopting elements of both.</p>', 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800', 'published', now() - interval '7 days'),
('Sovereign Cloud: Why European CIOs Are Rethinking Hyperscaler Dependencies', 'sovereign-cloud-european-cios', 'Cloud & Infrastructure', 'Marcus Doyle', 'Cloud Editor', 'Regulatory pressure and geopolitical uncertainty are driving renewed interest in regional cloud providers.', '<p>Europe''s regulatory landscape and heightened concerns over data sovereignty are fueling investment in local cloud providers and sovereign cloud offerings from the hyperscalers.</p>', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', 'published', now() - interval '8 days'),
('The CEO''s Guide to Boardroom Cybersecurity Conversations', 'ceo-guide-boardroom-cybersecurity', 'CEO Insights', 'Margaret Chen', 'Contributing Editor', 'Boards want fewer technical acronyms and more clarity on business risk. Here''s how leading CEOs are reframing the security narrative.', '<p>Cybersecurity has become a standing agenda item for most public company boards, but many CEOs still struggle to communicate risk in terms that resonate with directors.</p>', 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800', 'published', now() - interval '9 days'),
('AI Agents Move From Demo to Deployment', 'ai-agents-demo-to-deployment', 'AI & Analytics', 'Priya Ramanathan', 'Technology Correspondent', 'Autonomous AI agents are quietly finding real production use cases in customer service, IT operations, and financial reconciliation.', '<p>The agentic AI movement has moved past demos. Enterprises are deploying narrow, well-scoped agents that handle repetitive knowledge work under human oversight.</p>', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800', 'published', now() - interval '10 days'),
('Why Chief Data Officers Are Reporting to CEOs Again', 'cdos-reporting-to-ceos', 'CIO Insights', 'David Whitmore', 'Senior Analyst', 'The CDO role is being elevated as data becomes a first-class strategic asset in the age of AI.', '<p>After years of being buried inside IT organizations, the Chief Data Officer role is being elevated. In many enterprises, CDOs now report directly to the CEO or COO.</p>', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', 'published', now() - interval '11 days'),
('Kubernetes at Ten: The Platform That Ate Enterprise IT', 'kubernetes-at-ten', 'Cloud & Infrastructure', 'Marcus Doyle', 'Cloud Editor', 'A decade after its release, Kubernetes has become the default substrate for modern application platforms.', '<p>Kubernetes has quietly become the operating system of the modern enterprise, powering everything from banking cores to AI inference clusters.</p>', 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800', 'published', now() - interval '12 days'),
('Identity Is the New Perimeter — And Most Enterprises Are Behind', 'identity-new-perimeter', 'Cybersecurity', 'Elena Vasquez', 'Security Editor', 'Non-human identities now outnumber humans in most cloud environments, and governance is struggling to keep up.', '<p>The explosion of service accounts, API keys, and workload identities has created a governance gap that most security teams have yet to close.</p>', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800', 'published', now() - interval '13 days'),
('Building the AI-Ready Enterprise: A CEO Framework', 'ai-ready-enterprise-ceo-framework', 'CEO Insights', 'Margaret Chen', 'Contributing Editor', 'Preparing an organization for large-scale AI adoption requires as much cultural work as technical.', '<p>CEOs leading successful AI transformations focus equally on three dimensions: data foundations, workforce enablement, and governance.</p>', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', 'published', now() - interval '14 days'),
('The Modern CIO''s Talent Playbook', 'modern-cio-talent-playbook', 'CIO Insights', 'David Whitmore', 'Senior Analyst', 'Retaining platform engineers, SREs, and AI/ML specialists remains the number one operational challenge.', '<p>Despite tech industry layoffs, the war for specialist engineering talent shows no signs of cooling.</p>', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800', 'published', now() - interval '15 days'),
('Edge Computing Finds Its Killer Apps', 'edge-computing-killer-apps', 'Cloud & Infrastructure', 'Marcus Doyle', 'Cloud Editor', 'Manufacturing, retail, and telecommunications are proving that the edge isn''t just hype.', '<p>Real-world edge deployments are finally delivering measurable value in latency-sensitive industries.</p>', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800', 'published', now() - interval '16 days'),
('Post-Quantum Cryptography: What CIOs Need to Do Now', 'post-quantum-cryptography-cios', 'Cybersecurity', 'Elena Vasquez', 'Security Editor', 'The migration to quantum-resistant algorithms is a multi-year effort that must start today.', '<p>NIST''s finalization of post-quantum algorithms triggered the starting gun for enterprise migrations. Most large organizations should be assessing cryptographic inventory now.</p>', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800', 'published', now() - interval '17 days'),
('The Rise of the Chief AI Officer', 'rise-of-chief-ai-officer', 'AI & Analytics', 'Priya Ramanathan', 'Technology Correspondent', 'A new C-suite role is emerging to coordinate AI strategy, ethics, and enterprise-wide adoption.', '<p>The CAIO role is proliferating rapidly at Fortune 1000 companies, reflecting the strategic importance and cross-functional complexity of enterprise AI.</p>', 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800', 'published', now() - interval '18 days');

-- Seed magazines
INSERT INTO public.magazines (title, cover_image_url, issue_month, issue_year, status) VALUES
('The AI Enterprise Special', 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=600', 'November', 2026, 'published'),
('Cybersecurity Leaders Edition', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600', 'October', 2026, 'published'),
('Cloud Transformation Quarterly', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600', 'September', 2026, 'published');
