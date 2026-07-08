<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    public const BUYER = 'buyer';

    public const SELLER = 'seller';

    public const ADMIN = 'admin';

    public const MODERATOR = 'moderator';

    public const DEFAULT = self::BUYER;

    protected $fillable = ['name'];

    /**
     * @return list<string>
     */
    public static function names(): array
    {
        return [self::BUYER, self::SELLER, self::ADMIN, self::MODERATOR];
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
