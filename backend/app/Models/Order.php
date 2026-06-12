<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    /** @use HasFactory<\Database\Factories\OrderFactory> */
    use HasFactory;

    public const STATUS_PAID = 'paid';

    /**
     * Platform commission rate applied to the transaction total.
     */
    public const COMMISSION_RATE = 0.05;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'article_id',
        'buyer_id',
        'seller_id',
        'amount',
        'commission',
        'seller_payout',
        'status',
        'card_last4',
        'paid_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'commission' => 'decimal:2',
            'seller_payout' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * Round half-up to the cent.
     */
    public static function commissionFor(float $amount): float
    {
        return round($amount * self::COMMISSION_RATE, 2);
    }

    /**
     * @return BelongsTo<Article, $this>
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
