<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([Role::BUYER, Role::SELLER, Role::ADMIN] as $name) {
            Role::firstOrCreate(['name' => $name]);
        }
    }
}
