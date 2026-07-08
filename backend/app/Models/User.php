<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'banned_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * @return HasMany<Article, $this>
     */
    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    /**
     * Buyer's favourite categories (interests for recommendations).
     *
     * @return BelongsToMany<Category, $this>
     */
    public function favoriteCategories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    /**
     * Buyer's saved articles (wishlist).
     *
     * @return BelongsToMany<Article, $this>
     */
    public function favoriteArticles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class);
    }

    /**
     * Reviews this user has received (as a seller or a buyer).
     *
     * @return HasMany<Review, $this>
     */
    public function reviewsReceived(): HasMany
    {
        return $this->hasMany(Review::class, 'subject_id');
    }

    /**
     * Average rating received, rounded to one decimal (null if none).
     */
    public function averageRating(): ?float
    {
        $avg = $this->reviewsReceived()->avg('rating');

        return $avg !== null ? round((float) $avg, 1) : null;
    }

    public function isBanned(): bool
    {
        return $this->banned_at !== null;
    }

    public function ban(): void
    {
        $this->banned_at = now();
        $this->save();
        $this->tokens()->delete();
    }

    public function unban(): void
    {
        $this->banned_at = null;
        $this->save();
    }

    /**
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function hasRole(string $role): bool
    {
        return $this->roles()->where('name', $role)->exists();
    }

    public function assignRole(string $role): void
    {
        $roleModel = Role::where('name', $role)->firstOrFail();
        $this->roles()->syncWithoutDetaching($roleModel);
    }

    /**
     * Flat list of the user's role names, e.g. ['buyer', 'seller'].
     *
     * @return list<string>
     */
    public function roleNames(): array
    {
        /** @var list<string> $names */
        $names = $this->roles()->pluck('name')->all();

        return $names;
    }
}
