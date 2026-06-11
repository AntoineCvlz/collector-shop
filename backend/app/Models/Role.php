<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    public const BUYER = 'buyer';

    public const SELLER = 'seller';

    public const ADMIN = 'admin';

    /**
     * Role assigned to every account on registration.
     */
    public const DEFAULT = self::BUYER;

    protected $fillable = ['name'];

    /**
     * All role names recognised by the application.
     *
     * @return list<string>
     */
    public static function names(): array
    {
        return [self::BUYER, self::SELLER, self::ADMIN];
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
