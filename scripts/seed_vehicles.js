const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const orgId = '0140e25f-10f6-4099-a778-b42d9d191c06'; // Sucre
  
  // Get transport modes and fuel types
  const { data: modes } = await supabase.from('transport_modes').select('*').eq('organization_id', orgId);
  const { data: fuels } = await supabase.from('fuel_types').select('*');

  if (!modes || modes.length === 0) {
    console.log('No transport modes found for org');
    return;
  }

  const microbusModeId = modes.find(m => m.name.toLowerCase().includes('micro'))?.id || modes[0].id;
  const busModeId = modes.find(m => m.name.toLowerCase().includes('bus') && !m.name.toLowerCase().includes('micro'))?.id || modes[0].id;
  
  const dieselId = fuels.find(f => f.name.toLowerCase().includes('diésel'))?.id;
  const gnvId = fuels.find(f => f.name.toLowerCase().includes('gnv'))?.id;
  const evId = fuels.find(f => f.name.toLowerCase().includes('eléctrico'))?.id;

  const vehicles = [
    {
      organization_id: orgId,
      transport_mode_id: microbusModeId,
      fuel_type_id: dieselId,
      brand: 'Nissan',
      model: 'Civilian',
      capacity_seated: 24,
      capacity_standing: 10,
      fuel_efficiency: 5.5, // 5.5 km/l
      idle_congestion_factor: 0.15,
      replacement_value: 198360, // Aprox $28,500 USD
      useful_life_months: 120
    },
    {
      organization_id: orgId,
      transport_mode_id: microbusModeId,
      fuel_type_id: gnvId,
      brand: 'King Long',
      model: 'Microbús GNV 7m',
      capacity_seated: 22,
      capacity_standing: 12,
      fuel_efficiency: 4.8, // 4.8 km/m3
      idle_congestion_factor: 0.12,
      replacement_value: 260000, // Aprox $37,000 USD
      useful_life_months: 120
    },
    {
      organization_id: orgId,
      transport_mode_id: busModeId,
      fuel_type_id: evId,
      brand: 'BYD',
      model: 'K7 (Eléctrico)',
      capacity_seated: 26,
      capacity_standing: 20,
      fuel_efficiency: 1.1, // 1.1 km/kWh
      idle_congestion_factor: 0.0, // No consume en ralentí
      replacement_value: 1100000, // Aprox $158,000 USD
      useful_life_months: 180 // 15 años
    }
  ];

  console.log('Inserting vehicles...');
  for (const v of vehicles) {
    const { data, error } = await supabase.from('vehicle_types').insert([v]);
    if (error) {
      console.error('Error inserting', v.model, error.message);
    } else {
      console.log('Inserted:', v.brand, v.model);
    }
  }
}

seed().catch(console.error);
