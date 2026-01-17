-- Insert sample HARO queries for testing
INSERT INTO queries (publication, headline, full_text, requirements, journalist_contact, deadline, posted_at)
VALUES
  (
    'Forbes',
    'Looking for AI startup founders to share growth strategies',
    'I am writing an article about AI startups that have achieved significant growth in 2024. Looking for founders who can share their strategies for customer acquisition, fundraising, and team building. Please include specific metrics and lessons learned.',
    'Must be a founder or co-founder of an AI company. Company should have raised at least seed funding or achieved $1M ARR.',
    'sarah.tech@forbes.com',
    NOW() + INTERVAL '2 days',
    NOW() - INTERVAL '4 hours'
  ),
  (
    'Business Insider',
    'Career coaches needed: Tips for job seekers in 2025',
    'Writing a comprehensive guide for job seekers heading into 2025. Looking for career coaches and HR professionals to share actionable advice on resume writing, interview preparation, and salary negotiation. What mistakes do you see candidates making?',
    'Must be a certified career coach or HR professional with 5+ years experience.',
    NULL,
    NOW() + INTERVAL '18 hours',
    NOW() - INTERVAL '6 hours'
  ),
  (
    NULL,
    'Seeking financial advisors: Best investment strategies for beginners',
    'I am putting together an article on investment strategies for people just starting their financial journey. Looking for licensed financial advisors who can recommend approaches for someone with $5,000 to invest. Focus on low-risk options and retirement planning.',
    'Must be a licensed financial advisor. Please include your credentials in response.',
    NULL,
    NOW() + INTERVAL '3 days',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'TechCrunch',
    'SaaS founders: How are you handling pricing in 2025?',
    'Working on an in-depth piece about SaaS pricing strategies. Looking for founders who have experimented with different pricing models - freemium, usage-based, tiered pricing, etc. What worked? What did not? How did you decide on your current model?',
    'Must be a SaaS founder or pricing strategist. Please share specific examples and data.',
    'mike@techcrunch.com',
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '8 hours'
  ),
  (
    'Health Magazine',
    'Nutritionists: Best meal prep tips for busy professionals',
    'Creating a guide for busy professionals who want to eat healthier. Looking for registered dietitians and nutritionists to share quick meal prep strategies, healthy snack ideas, and tips for maintaining nutrition while traveling.',
    'Must be a registered dietitian or certified nutritionist.',
    'wellness@healthmag.com',
    NOW() + INTERVAL '4 days',
    NOW() - INTERVAL '1 hour'
  ),
  (
    'Entrepreneur',
    'Marketing experts: What is working on social media in 2025?',
    'Compiling expert insights on the current state of social media marketing. Which platforms are giving the best ROI? How has AI affected content creation? What strategies are working for B2B vs B2C? Looking for marketing professionals with proven track records.',
    'Must have 3+ years of social media marketing experience. Please include examples of campaigns you have run.',
    NULL,
    NOW() + INTERVAL '12 hours',
    NOW() - INTERVAL '30 minutes'
  ),
  (
    'Psychology Today',
    'Mental health professionals: Tips for managing work anxiety',
    'Writing about workplace anxiety and burnout. Seeking licensed therapists and psychologists to share evidence-based strategies for managing stress at work. What do you recommend to clients who are experiencing burnout?',
    'Must be a licensed mental health professional (LCSW, PhD, PsyD, etc).',
    'features@psychtoday.com',
    NOW() + INTERVAL '6 days',
    NOW() - INTERVAL '12 hours'
  ),
  (
    'CNBC',
    'Crypto experts: What is the outlook for Bitcoin in 2025?',
    'Seeking cryptocurrency analysts and blockchain experts to weigh in on Bitcoin market outlook for 2025. What factors will influence price? How is institutional adoption affecting the market? What should retail investors know?',
    'Must be a credentialed financial analyst or have verifiable expertise in cryptocurrency markets.',
    NULL,
    NOW() + INTERVAL '1 day',
    NOW() - INTERVAL '3 hours'
  );
