<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Category;
use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    /**
     * @var list<array{title: string, category: string, price: float, shipping: float, status: string, photo: string, description: string}>
     */
    private array $catalogue = [
        [
            'title' => 'Omega Seamaster 300 (1968)',
            'category' => 'Watches',
            'price' => 2450.00,
            'shipping' => 15.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=900&q=80',
            'description' => 'Vintage Omega Seamaster from 1968. Original dial, recently serviced, runs strong. Light wear on the case consistent with age. Comes with box.',
        ],
        [
            'title' => 'Rolex-style diver, automatic',
            'category' => 'Watches',
            'price' => 890.00,
            'shipping' => 12.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=900&q=80',
            'description' => 'Automatic diver watch, 200m water resistance, sapphire crystal. Excellent condition, barely worn. A great everyday collector piece.',
        ],
        [
            'title' => 'Pink Floyd — The Dark Side of the Moon (LP)',
            'category' => 'Vinyl',
            'price' => 42.00,
            'shipping' => 6.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=900&q=80',
            'description' => 'Original pressing, gatefold sleeve with both posters and stickers intact. Vinyl graded VG+, plays beautifully with minimal surface noise.',
        ],
        [
            'title' => 'Jazz vinyl collection — Blue Note bundle',
            'category' => 'Vinyl',
            'price' => 180.00,
            'shipping' => 10.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80',
            'description' => 'Bundle of five classic Blue Note jazz records from the 60s. All sleeves in very good shape, records cleaned and stored properly.',
        ],
        [
            'title' => 'Leica M3 rangefinder (1957)',
            'category' => 'Cameras',
            'price' => 1290.00,
            'shipping' => 18.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=900&q=80',
            'description' => 'Iconic Leica M3 double-stroke. Smooth film advance, clear viewfinder, accurate shutter. A true classic for the serious collector.',
        ],
        [
            'title' => 'Polaroid SX-70 instant camera',
            'category' => 'Cameras',
            'price' => 175.00,
            'shipping' => 9.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=900&q=80',
            'description' => 'Folding SX-70 in working order. Leather in great condition. Tested and producing lovely instant shots. Film not included.',
        ],
        [
            'title' => 'Morgan silver dollar (1921)',
            'category' => 'Coins',
            'price' => 95.00,
            'shipping' => 5.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=900&q=80',
            'description' => 'Genuine 1921 Morgan silver dollar, 90% silver. Nice detail and toning. A staple for any coin collection.',
        ],
        [
            'title' => 'Gold-coloured antique coin set',
            'category' => 'Coins',
            'price' => 320.00,
            'shipping' => 7.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=900&q=80',
            'description' => 'Curated set of antique commemorative coins displayed in a protective case. Sold as a complete lot.',
        ],
        [
            'title' => 'Art Deco diamond brooch',
            'category' => 'Jewellery',
            'price' => 540.00,
            'shipping' => 8.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&q=80',
            'description' => 'Elegant Art Deco brooch with paste stones in a geometric setting. Excellent vintage condition, clasp works perfectly.',
        ],
        [
            'title' => 'Vintage gold pocket watch',
            'category' => 'Jewellery',
            'price' => 410.00,
            'shipping' => 7.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=900&q=80',
            'description' => 'Engraved gold-plated pocket watch with chain. Mechanical movement winds and keeps time. A charming display piece.',
        ],
        [
            'title' => 'The Amazing Spider-Man #129 (1974)',
            'category' => 'Comics',
            'price' => 460.00,
            'shipping' => 6.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=900&q=80',
            'description' => 'First appearance of the Punisher. Bagged and boarded, presents well with bright colours. A key Bronze Age issue.',
        ],
        [
            'title' => 'Vintage comic book lot (Bronze Age)',
            'category' => 'Comics',
            'price' => 220.00,
            'shipping' => 9.00,
            'status' => 'published',
            'photo' => 'https://images.unsplash.com/photo-1601645191163-3fc0d5d64e35?w=900&q=80',
            'description' => 'Lot of 20 Bronze Age comics, various titles. Reading-grade copies, perfect for filling gaps in a collection.',
        ],

        [
            'title' => 'Seiko 6139 chronograph (1970s)',
            'category' => 'Watches',
            'price' => 520.00,
            'shipping' => 10.00,
            'status' => 'pending',
            'photo' => 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=900&q=80',
            'description' => 'One of the first automatic chronographs. Pulsations bezel, original bracelet. Submitted for review.',
        ],
        [
            'title' => 'The Beatles — Abbey Road (LP)',
            'category' => 'Vinyl',
            'price' => 55.00,
            'shipping' => 6.00,
            'status' => 'pending',
            'photo' => 'https://images.unsplash.com/photo-1458560871784-56d23406c091?w=900&q=80',
            'description' => 'Classic Abbey Road pressing, sleeve shows light shelf wear. Vinyl plays clean. Awaiting approval.',
        ],

        [
            'title' => 'Nikon F2 with 50mm lens',
            'category' => 'Cameras',
            'price' => 640.00,
            'shipping' => 14.00,
            'status' => 'sold',
            'photo' => 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=900&q=80',
            'description' => 'Professional-grade Nikon F2 with a sharp 50mm f/1.4. Fully mechanical, a workhorse SLR. Now sold.',
        ],
        [
            'title' => 'Roman denarius, 2nd century',
            'category' => 'Coins',
            'price' => 310.00,
            'shipping' => 6.00,
            'status' => 'sold',
            'photo' => 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=900&q=80',
            'description' => 'Authentic Roman silver denarius with clear portrait. Certificate of authenticity included. Now sold.',
        ],
    ];

    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $admin = $this->account('Alice Admin', 'admin@demo.test', [Role::ADMIN]);
        $this->account('Mona Moderator', 'moderator@demo.test', [Role::MODERATOR]);
        $seller = $this->account('Sam Seller', 'seller@demo.test', [Role::SELLER]);
        $buyer = $this->account('Bob Buyer', 'buyer@demo.test', [Role::BUYER]);
        $trader = $this->account('Tia Trader', 'trader@demo.test', [Role::BUYER, Role::SELLER]);

        $sellers = [$seller->id, $trader->id];

        foreach ($this->catalogue as $i => $item) {
            $category = Category::firstOrCreate(
                ['name' => $item['category']],
                ['slug' => Str::slug($item['category'])],
            );

            $article = Article::create([
                'user_id' => $sellers[$i % count($sellers)],
                'category_id' => $category->id,
                'title' => $item['title'],
                'description' => $item['description'],
                'price' => $item['price'],
                'shipping_cost' => $item['shipping'],
                'status' => $item['status'],
                'published_at' => $item['status'] === Article::STATUS_PENDING ? null : now(),
            ]);

            $this->attachPhoto($article, $item['photo']);

            if ($item['status'] === Article::STATUS_SOLD) {
                $this->recordSale($article, $buyer);
            }
        }

        $this->command->info('Demo data ready. Log in with <role>@demo.test / password');
        $this->command->info('Admin account: '.$admin->email);
    }

    /**
     * @param  list<string>  $roles
     */
    private function account(string $name, string $email, array $roles): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make('password')],
        );

        foreach ($roles as $role) {
            $user->assignRole($role);
        }

        return $user;
    }

    private function recordSale(Article $article, User $buyer): void
    {
        $amount = (float) $article->price + (float) $article->shipping_cost;
        $commission = Order::commissionFor($amount);

        Order::create([
            'article_id' => $article->id,
            'buyer_id' => $buyer->id,
            'seller_id' => $article->user_id,
            'amount' => $amount,
            'commission' => $commission,
            'seller_payout' => round($amount - $commission, 2),
            'status' => Order::STATUS_PAID,
            'card_last4' => '4242',
            'paid_at' => now(),
        ]);
    }

    private function attachPhoto(Article $article, string $url): void
    {
        $path = 'articles/demo-'.$article->id.'.jpg';

        try {
            $response = Http::timeout(15)->get($url);

            if ($response->successful()) {
                Storage::disk('public')->put($path, $response->body());
                $article->images()->create(['path' => $path, 'position' => 1]);

                return;
            }
        } catch (\Throwable $e) {
        }

        $this->attachPlaceholder($article);
    }

    private function attachPlaceholder(Article $article): void
    {
        $palette = ['#FF5A4D', '#1f6feb', '#10b981', '#a855f7', '#f59e0b', '#0ea5e9'];
        $bg = $palette[$article->id % count($palette)];
        $label = htmlspecialchars(Str::limit((string) $article->title, 22), ENT_QUOTES);

        $svg = <<<SVG
            <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
              <rect width="600" height="600" fill="{$bg}"/>
              <text x="50%" y="50%" fill="#ffffff" font-family="sans-serif" font-size="32"
                    font-weight="700" text-anchor="middle" dominant-baseline="middle">{$label}</text>
            </svg>
            SVG;

        $path = 'articles/demo-'.$article->id.'.svg';
        Storage::disk('public')->put($path, $svg);
        $article->images()->create(['path' => $path, 'position' => 1]);
    }
}
