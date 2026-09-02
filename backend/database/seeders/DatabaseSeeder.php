<?php

namespace Database\Seeders;

use App\Models\Space;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'name' => env('ZAWSE_USER_ONE_NAME', 'You'),
                'email' => env('ZAWSE_USER_ONE_EMAIL'),
                'password' => env('ZAWSE_USER_ONE_PASSWORD'),
            ],
            [
                'name' => env('ZAWSE_USER_TWO_NAME', 'Love'),
                'email' => env('ZAWSE_USER_TWO_EMAIL'),
                'password' => env('ZAWSE_USER_TWO_PASSWORD'),
            ],
        ];

        foreach ($accounts as $account) {
            if (! $account['email'] || ! $account['password']) {
                throw new RuntimeException('Set both ZAWSE user emails and passwords in backend/.env before seeding.');
            }
        }

        $space = Space::firstOrCreate(['name' => env('ZAWSE_SPACE_NAME', 'Zawsze in Love')]);

        foreach ($accounts as $account) {
            $user = User::updateOrCreate(
                ['email' => strtolower($account['email'])],
                ['name' => $account['name'], 'password' => Hash::make($account['password'])]
            );

            $space->users()->syncWithoutDetaching([$user->id]);
        }
    }
}
