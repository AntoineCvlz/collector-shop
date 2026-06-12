<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ArticleImage extends Model
{
    /** @use HasFactory<\Database\Factories\ArticleImageFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = ['article_id', 'path', 'position'];

    /**
     * @var list<string>
     */
    protected $appends = ['url'];

    /**
     * @return BelongsTo<Article, $this>
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    /**
     * Public URL for the stored image.
     *
     * @return Attribute<string, never>
     */
    protected function url(): Attribute
    {
        return Attribute::get(fn (): string => Storage::disk('public')->url($this->path));
    }
}
