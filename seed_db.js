const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient('https://etglswbpubgjngzxlmqg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0Z2xzd2JwdWJnam5nenhsbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjIxMTI0OCwiZXhwIjoyMTA3Nzg3MjQ4fQ.GQpB-xNaTymOC_eqW2hS9_Un2Optl5JbshZN8g3a09s');

async function seed() {
  console.log('Starting direct DB seed...');

  try {
    let { data: orgs } = await supabaseAdmin.from('organizations').select('id').eq('name', 'Demo Industries Pvt Ltd').single();
    let orgId = orgs?.id;

    if (!orgId) {
      const { data: newOrg, error: orgErr } = await supabaseAdmin
        .from('organizations')
        .insert({ name: 'Demo Industries Pvt Ltd' })
        .select()
        .single();
      
      if (orgErr) throw orgErr;
      orgId = newOrg.id;
    }
    console.log('Org ID:', orgId);

    const deps = ['Engineering', 'Sales', 'HR', 'Finance'];
    for (const name of deps) {
      await supabaseAdmin.from('departments').upsert({ org_id: orgId, name });
    }
    console.log('Departments seeded');

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

      let userId;
      if (authErr) {
        console.log(`User ${u.email} already exists or error: ${authErr.message}`);
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const found = users.users.find(user => user.email === u.email);
        if (found) {
            userId = found.id;
        } else {
            console.error(`Could not find user ID for ${u.email}`);
            continue;
        }
      } else {
        userId = authUser.user.id;
      }

      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        org_id: orgId,
        full_name: u.name,
        email: u.email,
        role: u.role,
      });

      await supabaseAdmin.from('employees').upsert({
        profile_id: userId,
        org_id: orgId,
        employee_code: u.email.split('@')[0].toUpperCase(),
        job_title: 'Software Engineer',
        status: 'active',
        start_date: '2024-01-01',
      }, { onConflict: 'profile_id' });
      
      console.log(`Seeded user: ${u.email}`);
    }

    console.log('SEEDING COMPLETE!');
  } catch (err) {
    console.error('Seed failed:', err);
  }
}

seed();
