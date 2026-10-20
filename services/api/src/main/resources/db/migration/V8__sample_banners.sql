-- Sample announcements so the home slider is not empty on a fresh install. Edit or delete them in Admin > Announcements.
INSERT INTO banners(title, subtitle, cta_label, link_url, theme, sort_order)
SELECT * FROM (VALUES
  ('{"ar":"المنتدى العالمي لإدارة المشاريع GPMF 2026","en":"Global Project Management Forum GPMF 2026"}'::jsonb,
   '{"ar":"سجّل الآن واحجز مقعدك في أكبر تجمّع لقادة المشاريع","en":"Register now and reserve your seat at the biggest gathering of project leaders"}'::jsonb,
   '{"ar":"زيارة موقع GPMF","en":"Visit the GPMF website"}'::jsonb, 'https://gpmf.world', 'navy', 1),
  ('{"ar":"ورشة عمل قادمة: أساسيات إدارة المشاريع","en":"Upcoming workshop: project management essentials"}'::jsonb,
   '{"ar":"ورشة تطبيقية مباشرة مع مرشدي الأكاديمية. المقاعد محدودة","en":"A hands-on live workshop with the academy mentors. Limited seats"}'::jsonb,
   '{"ar":"احجز مقعدك","en":"Book your seat"}'::jsonb, '/courses', 'gold', 2),
  ('{"ar":"ندوة مجانية: كيف تبدأ مسارك المهني","en":"Free webinar: how to start your career path"}'::jsonb,
   '{"ar":"جلسة مباشرة مجانية مع خبراء الأكاديمية","en":"A free live session with the academy experts"}'::jsonb,
   '{"ar":"استعرض الدورات المجانية","en":"See free courses"}'::jsonb, '/courses', 'teal', 3)
) AS v(title, subtitle, cta_label, link_url, theme, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM banners);
