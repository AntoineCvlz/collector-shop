<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    /**
     * Only buyers may check out.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->hasRole(Role::BUYER);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'card_number' => ['required', 'string', $this->luhnRule()],
            'card_name' => ['required', 'string', 'min:3', 'max:255'],
            'expiry_month' => ['required', 'integer', 'between:1,12'],
            'expiry_year' => ['required', 'integer', 'min:'.(int) date('Y'), 'max:'.((int) date('Y') + 20)],
            'cvv' => ['required', 'string', 'regex:/^\d{3,4}$/'],
        ];
    }

    /**
     * Validate the card number: digits only, length 13-19, passes Luhn.
     */
    private function luhnRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $digits = preg_replace('/\s+/', '', is_string($value) ? $value : '') ?? '';

            if (preg_match('/^\d{13,19}$/', $digits) !== 1 || ! $this->passesLuhn($digits)) {
                $fail('The card number is invalid.');
            }
        };
    }

    private function passesLuhn(string $number): bool
    {
        $sum = 0;
        $alt = false;

        for ($i = strlen($number) - 1; $i >= 0; $i--) {
            $digit = (int) $number[$i];

            if ($alt) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit -= 9;
                }
            }

            $sum += $digit;
            $alt = ! $alt;
        }

        return $sum % 10 === 0;
    }

    /**
     * Additionally ensure the expiry date is not in the past.
     */
    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $validator): void {
            $year = $this->integer('expiry_year');
            $month = $this->integer('expiry_month');

            if ($year === 0 || $month === 0) {
                return;
            }

            $now = now();
            if ($year < $now->year || ($year === $now->year && $month < $now->month)) {
                $validator->errors()->add('expiry_month', 'The card has expired.');
            }
        });
    }
}
