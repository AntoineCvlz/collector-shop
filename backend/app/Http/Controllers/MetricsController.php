<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Response;
use Prometheus\CollectorRegistry;
use Prometheus\RenderTextFormat;

class MetricsController extends Controller
{
    public function __construct(private readonly CollectorRegistry $registry) {}

    public function __invoke(): Response
    {
        $this->sampleBusinessGauges();

        $rendered = (new RenderTextFormat)->render($this->registry->getMetricFamilySamples());

        return new Response($rendered, 200, [
            'Content-Type' => RenderTextFormat::MIME_TYPE,
        ]);
    }

    private function sampleBusinessGauges(): void
    {
        $this->setGauge('users_total', 'Nombre de comptes utilisateurs.', User::count());
        $this->setGauge('articles_total', 'Nombre total d\'articles.', Article::count());
        $this->setGauge(
            'articles_published_total',
            'Nombre d\'articles publiés (en vente).',
            Article::where('status', Article::STATUS_PUBLISHED)->count(),
        );
        $this->setGauge(
            'articles_sold_total',
            'Nombre d\'articles vendus.',
            Article::where('status', Article::STATUS_SOLD)->count(),
        );
        $this->setGauge('orders_total', 'Nombre total de commandes.', Order::count());
    }

    private function setGauge(string $name, string $help, int $value): void
    {
        $this->registry
            ->getOrRegisterGauge('collector', $name, $help)
            ->set($value);
    }
}
