
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function seedDemoData() {
  console.log("Seeding demo data...");

  // 1. Create Organization
  const { data: org, error: orgErr } = await supabaseAdmin
    .from('organizations')
    .upsert({ name: 'Demo Industries Pvt Ltd' }, { onConflict: 'id' })
    .select()
    .single();
  
  if (orgErr) throw orgErr;
  const orgId = org.id;

  // 2. Create Departments
  const deps = ['Engineering', 'Sales', 'HR', 'Finance'];
  for (const name of deps) {
    await supabaseAdmin.from('departments').upsert({ org_id: orgId, name });
  }

  // 3. Create Users via Auth Admin API (requires service role)
  const demoUsers = [
    { email: 'admin@demo.test', password: 'Admin@123', role: 'admin', name: 'Super Admin' },
    { email: 'manager1@demo.test', password: 'Manager@123', role: 'manager', name: 'Manager One' },
    { email: 'manager2@demo.test', password: 'Manager@123', role: 'manager', name: 'Manager Two' },
    { email: 'emp1@demo.test', password: 'Employee@123', role: 'employee', name: 'Employee One' },
    { email: 'emp2@demo.test', password: 'Employee@123', role: 'employee', name: 'Employee Two' },
    { email: 'emp3@demo.test', password: 'Employee@123', role: 'employee', name: 'Employee Three' },
  ];

  for (const u of demoUsers) {
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });

    if (authErr) {
      console.log(`Skipping user ${u.email} (maybe exists)`);
      continue;
    }

    // Create profile
    await supabaseAdmin.from('profiles').insert({
      id: authUser.user.id,
      org_id: orgId,
      full_name: u.name,
      email: u.email,
      role: u.role,
    });

    // Create employee entry
    await supabaseAdmin.from('employees').insert({
      org_id: orgId,
      profile_id: authUser.user.id,
      employee_code: u.email.split('@')[0].toUpperCase(),
      job_title: 'Software Engineer',
      status: 'active',
      start_date: '2024-01-01',
    });
  }

  console.log("Seeding completed!");
}
