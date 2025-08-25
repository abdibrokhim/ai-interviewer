-- Seed initial credit packages and a public question template

insert into public.credit_packages (name, credits, price_cents, currency, is_active)
values
  ('Starter 100', 100, 9900, 'USD', true),
  ('Growth 500', 500, 44900, 'USD', true),
  ('Scale 2000', 2000, 159900, 'USD', true)
on conflict do nothing;

insert into public.question_templates (title, description, job_role, content, is_public)
values (
  'Software Engineer I - General',
  'Entry-level SWE template with mixed behavioral and basic coding questions',
  'software_engineer_i',
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object('type','behavioral','questions', jsonb_build_array(
        jsonb_build_object('q','Tell me about a challenging bug you fixed','depth','LOW'),
        jsonb_build_object('q','Describe a time you worked in a team','depth','LOW')
      )),
      jsonb_build_object('type','coding','questions', jsonb_build_array(
        jsonb_build_object('q','Implement a function to check for palindrome','lang','any','difficulty','EASY'),
        jsonb_build_object('q','Find two-sum indices','lang','any','difficulty','EASY')
      ))
    )
  ),
  true
) on conflict do nothing;


