<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Prometheus\CollectorRegistry;
use Prometheus\Exception\MetricsRegistrationException;
use Symfony\Component\HttpFoundation\Response;

class CollectHttpMetrics
{
    public function __construct(private readonly CollectorRegistry $registry) {}

    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        $response = $next($request);

        $this->record($request, $response, microtime(true) - $start);

        return $response;
    }

    private function record(Request $request, Response $response, float $durationSeconds): void
    {
        $route = $request->route()?->uri() ?? 'unmatched';
        $method = $request->getMethod();
        $status = (string) $response->getStatusCode();

        try {
            $this->registry->getOrRegisterCounter(
                'collector',
                'http_requests_total',
                'Nombre total de requêtes HTTP traitées.',
                ['method', 'route', 'status'],
            )->inc([$method, $route, $status]);

            $this->registry->getOrRegisterHistogram(
                'collector',
                'http_request_duration_seconds',
                'Durée de traitement des requêtes HTTP (secondes).',
                ['method', 'route'],
                [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            )->observe($durationSeconds, [$method, $route]);
        } catch (MetricsRegistrationException) {
        }
    }
}
