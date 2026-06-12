<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreArticleRequest extends FormRequest
{
    /**
     * Only sellers may create listings.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->hasRole(Role::SELLER);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'title' => ['required', 'string', 'min:3', 'max:255'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'price' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'images' => ['nullable', 'array', 'max:6'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
